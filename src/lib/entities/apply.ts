/**
 * Low-level entity writes. Everything here takes a transaction client and is
 * only called from propose.ts / approve.ts, which decide whether a change is
 * allowed. Nothing else in the app should write Entity or EntityTag rows.
 */
import { Prisma } from "@/generated/prisma/client";
import { ENTITY_STATUS, ENTITY_TYPE, TagCategory } from "@/lib/prismaEnums";
import { generateSlug } from "@/lib/utils";
import { ConsentRequiredError, NotFoundError, StaleVersionError, ValidationError } from "./errors";
import { IMAGE_FIELDS, type EntityChanges, type EntityState, type ImageField } from "./fields";
import { requiresConsent } from "./policy";

export type Tx = Prisma.TransactionClient;

const stateInclude = {
  categories: { select: { slug: true } },
  tags: { select: { tag: { select: { slug: true } } } },
} as const;

type EntityWithState = Prisma.EntityGetPayload<{ include: typeof stateInclude }>;

export function toState(entity: EntityWithState): EntityState {
  const images = (entity.images ?? {}) as Record<string, unknown>;
  const image = (key: string) => (typeof images[key] === "string" && images[key] ? (images[key] as string) : null);
  return {
    name: entity.name,
    nameTranslations: (entity.nameTranslations as Record<string, string> | null) ?? null,
    description: entity.description,
    descriptionTranslations: (entity.descriptionTranslations as Record<string, string> | null) ?? null,
    seoTitleTranslations: (entity.seoTitleTranslations as Record<string, string> | null) ?? null,
    seoDescriptionTranslations: (entity.seoDescriptionTranslations as Record<string, string> | null) ?? null,
    address: entity.address,
    phone: entity.phone,
    website: entity.website,
    latitude: entity.latitude,
    longitude: entity.longitude,
    entityType: entity.entityType,
    hours: (entity.hours as EntityState["hours"]) ?? null,
    socialMedia: (entity.socialMedia as EntityState["socialMedia"]) ?? null,
    displaySettings: (entity.displaySettings as EntityState["displaySettings"]) ?? null,
    logoImage: image(IMAGE_FIELDS.logoImage),
    coverImage: image(IMAGE_FIELDS.coverImage),
    categorySlugs: entity.categories.map((c) => c.slug).sort(),
    tagSlugs: entity.tags.map((t) => t.tag.slug).sort(),
    slug: entity.slug,
    status: entity.status,
    featured: entity.featured,
    spotCheckDate: entity.spotCheckDate ? entity.spotCheckDate.toISOString() : null,
    verificationContact: entity.verificationContact,
  };
}

export async function loadEntityState(
  db: Tx,
  entityId: string
): Promise<{ state: EntityState; version: number }> {
  const entity = await db.entity.findUnique({ where: { id: entityId }, include: stateInclude });
  if (!entity) throw new NotFoundError();
  return { state: toState(entity), version: entity.version };
}

const jsonOrNull = (value: unknown) =>
  value === null || value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);

/** Scalar columns for the fields present in `changes` (relations handled separately). */
function scalarData(changes: EntityChanges): Prisma.EntityUncheckedUpdateManyInput {
  const data: Prisma.EntityUncheckedUpdateManyInput = {};
  for (const [field, value] of Object.entries(changes)) {
    switch (field) {
      case "categorySlugs":
      case "tagSlugs":
      case "slug":
      case "logoImage":
      case "coverImage":
        break; // relations, slug uniqueness and the images column are handled by the callers
      case "nameTranslations":
      case "descriptionTranslations":
      case "seoTitleTranslations":
      case "seoDescriptionTranslations":
      case "hours":
      case "socialMedia":
      case "displaySettings":
        (data as Record<string, unknown>)[field] = jsonOrNull(value);
        break;
      case "spotCheckDate":
        data.spotCheckDate = value ? new Date(value as string) : null;
        break;
      default:
        (data as Record<string, unknown>)[field] = value;
    }
  }
  return data;
}

async function ensureUniqueSlug(db: Tx, desired: string, excludeEntityId?: string): Promise<string> {
  const base = generateSlug(desired) || "entity";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await db.entity.findFirst({
      where: { slug: candidate, ...(excludeEntityId ? { NOT: { id: excludeEntityId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
}

async function resolveCategoryIds(db: Tx, slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) {
    throw new ValidationError("At least one category is required", { categorySlugs: "validation.categoryRequired" });
  }
  const categories = await db.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  const unknown = slugs.filter((s) => !categories.some((c) => c.slug === s));
  if (unknown.length > 0) {
    throw new ValidationError(`Unknown categories: ${unknown.join(", ")}`, { categorySlugs: "validation.unknownCategory" });
  }
  return categories.map((c) => c.id);
}

async function resolveTags(db: Tx, slugs: string[]) {
  if (slugs.length === 0) return [];
  const tags = await db.tag.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  const unknown = slugs.filter((s) => !tags.some((t) => t.slug === s));
  if (unknown.length > 0) {
    throw new ValidationError(`Unknown tags: ${unknown.join(", ")}`, { tagSlugs: "validation.unknownTag" });
  }
  return tags;
}

/** The IDENTITY tags (Black-owned, ...) among `slugs`. See assertIdentityTagsFromPeople in propose.ts. */
export async function identityTagSlugs(db: Tx, slugs: readonly string[] | undefined): Promise<string[]> {
  if (!slugs || slugs.length === 0) return [];
  const tags = await db.tag.findMany({
    where: { slug: { in: [...slugs] }, category: TagCategory.IDENTITY },
    select: { slug: true },
  });
  return tags.map((t) => t.slug);
}

/**
 * Opt-in: a listing that needs consent can't be ACTIVE without it. Consent is
 * the owner publishing it (consent.ts), or an admin making it public
 * themselves (`actingAdminId`). Nothing else can: not an approved suggestion,
 * an AI draft, or an owner's ordinary edit.
 */
function assertPublishable(status: string, entityType: string, consented: boolean) {
  if (status === ENTITY_STATUS.ACTIVE && requiresConsent(entityType) && !consented) {
    throw new ConsentRequiredError();
  }
}

/** Consent fields to write with a change: set them, clear them (null), or leave them (undefined). */
export type ConsentWrite = { at: Date; byId: string; termsVersion: string | null } | null | undefined;

/**
 * Create an entity from a full proposed state. Tags added through an approved
 * (or admin) change are verified; createdBy records who proposed them. With
 * `owner`, that user becomes the listing's OWNER; otherwise it's unclaimed.
 * A new listing has no consent yet, so types that need it start INACTIVE
 * (a private draft) and can't be created ACTIVE.
 */
export async function createEntity(
  db: Tx,
  state: EntityChanges,
  opts: {
    createdBy: string | null;
    status?: string;
    owner?: { userId: string; addedBy: string | null };
    /** The admin doing this themselves, who may make any listing public. */
    actingAdminId?: string | null;
  }
) {
  if (!state.name) {
    throw new ValidationError("Entity name is required", { name: "validation.nameRequired" });
  }
  const entityType = state.entityType ?? ENTITY_TYPE.COMMERCE;
  const status =
    opts.status ?? state.status ?? (requiresConsent(entityType) ? ENTITY_STATUS.INACTIVE : ENTITY_STATUS.ACTIVE);
  // An admin publishing it stands in for the owner's agreement, and is recorded as such.
  const adminPublishes = status === ENTITY_STATUS.ACTIVE && requiresConsent(entityType) && !!opts.actingAdminId;
  assertPublishable(status, entityType, adminPublishes);

  const categoryIds = await resolveCategoryIds(db, state.categorySlugs ?? []);
  const tags = await resolveTags(db, state.tagSlugs ?? []);
  const slug = await ensureUniqueSlug(db, state.slug || state.name);

  const created = await db.entity.create({
    data: {
      ...(scalarData(state) as Prisma.EntityUncheckedCreateInput),
      name: state.name,
      slug,
      entityType: entityType as Prisma.EntityUncheckedCreateInput["entityType"],
      status: status as Prisma.EntityUncheckedCreateInput["status"],
      ...(adminPublishes && { consentedAt: new Date(), consentedById: opts.actingAdminId }),
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
    select: { id: true },
  });

  if (tags.length > 0) {
    await db.entityTag.createMany({
      data: tags.map((tag) => ({ entityId: created.id, tagId: tag.id, verified: true, createdBy: opts.createdBy })),
    });
  }
  if (opts.owner) {
    await db.entityMember.create({
      data: { entityId: created.id, userId: opts.owner.userId, role: "OWNER", addedBy: opts.owner.addedBy },
    });
  }
  return created.id;
}

/**
 * Apply `changes` to an entity, bumping its version. Fails with
 * StaleVersionError if the entity is no longer at `expectedVersion`.
 * Untouched fields, and tags that stay, are left exactly as they were.
 * Refuses to leave a listing that needs consent ACTIVE without it. Only
 * consent.ts passes `consent`.
 */
export async function updateEntity(
  db: Tx,
  entityId: string,
  changes: EntityChanges,
  opts: {
    expectedVersion: number;
    createdBy: string | null;
    consent?: ConsentWrite;
    /** The admin doing this themselves, who may make any listing public. */
    actingAdminId?: string | null;
  }
) {
  const current = await db.entity.findUnique({
    where: { id: entityId },
    select: { status: true, entityType: true, consentedAt: true, images: true, tags: { select: { tagId: true } } },
  });
  if (!current) throw new NotFoundError();
  const nextStatus = changes.status ?? current.status;
  const nextType = changes.entityType ?? current.entityType;
  let consent = opts.consent;
  let consented = consent !== undefined ? consent !== null : current.consentedAt !== null;
  if (!consented && consent === undefined && opts.actingAdminId && nextStatus === ENTITY_STATUS.ACTIVE && requiresConsent(nextType)) {
    // An admin publishing it stands in for the owner's agreement, and is
    // recorded as such (no terms version: the owner didn't go through them).
    consent = { at: new Date(), byId: opts.actingAdminId, termsVersion: null };
    consented = true;
  }
  assertPublishable(nextStatus, nextType, consented);

  let tagChanges: { removed: string[]; added: { id: string }[] } | null = null;
  if (changes.tagSlugs !== undefined) {
    const wanted = await resolveTags(db, changes.tagSlugs);
    const existingIds = new Set(current.tags.map((t) => t.tagId));
    const wantedIds = new Set(wanted.map((t) => t.id));
    const added = wanted.filter((t) => !existingIds.has(t.id));
    tagChanges = { removed: [...existingIds].filter((id) => !wantedIds.has(id)), added };
  }

  const data = scalarData(changes);
  if (changes.slug !== undefined) {
    data.slug = await ensureUniqueSlug(db, changes.slug, entityId);
  }
  const imageFields = (Object.keys(IMAGE_FIELDS) as ImageField[]).filter((field) => changes[field] !== undefined);
  if (imageFields.length > 0) {
    // One column holds both images; change only the ones in `changes`.
    const images = { ...((current.images ?? {}) as Record<string, unknown>) };
    for (const field of imageFields) {
      if (changes[field]) images[IMAGE_FIELDS[field]] = changes[field];
      else delete images[IMAGE_FIELDS[field]];
    }
    data.images = jsonOrNull(Object.keys(images).length > 0 ? images : null);
  }
  if (consent !== undefined) {
    data.consentedAt = consent?.at ?? null;
    data.consentedById = consent?.byId ?? null;
    data.consentTermsVersion = consent?.termsVersion ?? null;
  }

  const { count } = await db.entity.updateMany({
    where: { id: entityId, version: opts.expectedVersion },
    data: { ...data, version: { increment: 1 } },
  });
  if (count === 0) {
    const exists = await db.entity.findUnique({ where: { id: entityId }, select: { version: true } });
    if (!exists) throw new NotFoundError();
    throw new StaleVersionError(exists.version);
  }

  if (changes.categorySlugs !== undefined) {
    const categoryIds = await resolveCategoryIds(db, changes.categorySlugs);
    await db.entity.update({
      where: { id: entityId },
      data: { categories: { set: categoryIds.map((id) => ({ id })) } },
    });
  }

  if (tagChanges) {
    if (tagChanges.removed.length > 0) {
      await db.entityTag.deleteMany({ where: { entityId, tagId: { in: tagChanges.removed } } });
    }
    if (tagChanges.added.length > 0) {
      await db.entityTag.createMany({
        data: tagChanges.added.map((tag) => ({ entityId, tagId: tag.id, verified: true, createdBy: opts.createdBy })),
      });
    }
  }

  return opts.expectedVersion + 1;
}
