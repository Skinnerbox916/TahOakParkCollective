import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { normalizeSnapshot, type EntitySnapshot } from "@/lib/entitySnapshot";
import { generateSlug } from "@/lib/utils";
import { Prisma, type EntityStatus } from "@/generated/prisma/client";

interface ApplySnapshotOptions {
  targetEntityId?: string | null;
  defaultOwnerId: string;
  statusForNew?: EntityStatus;
}

async function ensureUniqueSlug(baseSlug: string, excludeEntityId?: string | null): Promise<string> {
  const base = baseSlug || generateSlug(baseSlug);
  let candidate = base;
  let counter = 1;

  // Loop until unique
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.entity.findFirst({
      where: {
        slug: candidate,
        ...(excludeEntityId ? { NOT: { id: excludeEntityId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

/**
 * Apply a full entity snapshot to either create or update an entity.
 * Returns the resulting entity with categories, owner, and tags.
 */
export async function applyEntitySnapshot(
  rawSnapshot: EntitySnapshot,
  { targetEntityId = null, defaultOwnerId, statusForNew = ENTITY_STATUS.ACTIVE }: ApplySnapshotOptions
) {
  const snapshot = normalizeSnapshot(rawSnapshot);

  if (!snapshot.name || !snapshot.name.trim()) {
    throw new Error("Snapshot name is required");
  }

  if (!snapshot.categorySlugs || snapshot.categorySlugs.length === 0) {
    throw new Error("At least one category is required");
  }

  // Resolve categories/tags
  const categories = await prisma.category.findMany({
    where: { slug: { in: snapshot.categorySlugs } },
    select: { id: true, slug: true },
  });
  if (categories.length === 0) {
    throw new Error("No categories resolved from categorySlugs");
  }

  const tags =
    snapshot.tagSlugs && snapshot.tagSlugs.length > 0
      ? await prisma.tag.findMany({
          where: { slug: { in: snapshot.tagSlugs } },
          select: { id: true, slug: true, category: true },
        })
      : [];

  const slug = await ensureUniqueSlug(snapshot.slug || generateSlug(snapshot.name), targetEntityId);

  // Shared scalar/JSON fields. Relations (owner, categories) are applied per
  // path below since their shape differs between create and update.
  const scalarData: Omit<Prisma.EntityCreateInput, "owner" | "categories"> = {
    name: snapshot.name.trim(),
    slug,
    description: snapshot.description ?? null,
    descriptionTranslations: snapshot.descriptionTranslations ?? Prisma.DbNull,
    nameTranslations: snapshot.nameTranslations ?? Prisma.DbNull,
    address: snapshot.address ?? null,
    phone: snapshot.phone ?? null,
    website: snapshot.website ?? null,
    latitude: snapshot.latitude ?? null,
    longitude: snapshot.longitude ?? null,
    entityType: snapshot.entityType ?? undefined,
    hours: (snapshot.hours ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
    socialMedia: (snapshot.socialMedia ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
    displaySettings: (snapshot.displaySettings ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
    images: (snapshot.images ?? undefined) as Prisma.InputJsonValue | undefined,
    seoTitleTranslations: snapshot.seoTitleTranslations ?? Prisma.DbNull,
    seoDescriptionTranslations: snapshot.seoDescriptionTranslations ?? Prisma.DbNull,
  };

  if (!targetEntityId) {
    // Create new
    const entity = await prisma.$transaction(async (tx) => {
      const created = await tx.entity.create({
        data: {
          ...scalarData,
          status: statusForNew ?? ENTITY_STATUS.ACTIVE,
          owner: { connect: { id: snapshot.ownerId || defaultOwnerId } },
          categories: { connect: categories.map((c) => ({ id: c.id })) },
        },
      });

      if (tags.length > 0) {
        await tx.entityTag.createMany({
          data: tags.map((tag) => ({
            entityId: created.id,
            tagId: tag.id,
            verified: true,
          })),
        });
      }

      return tx.entity.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          categories: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          tags: { include: { tag: true } },
        },
      });
    });

    return entity;
  }

  // Update existing
  const entity = await prisma.$transaction(async (tx) => {
    const updated = await tx.entity.update({
      where: { id: targetEntityId },
      data: {
        ...scalarData,
        ...(snapshot.ownerId ? { owner: { connect: { id: snapshot.ownerId } } } : {}),
        categories: { set: categories.map((c) => ({ id: c.id })) },
      },
      include: {
        categories: true,
        owner: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });

    // Replace tags
    await tx.entityTag.deleteMany({ where: { entityId: targetEntityId } });
    if (tags.length > 0) {
      await tx.entityTag.createMany({
        data: tags.map((tag) => ({
          entityId: targetEntityId,
          tagId: tag.id,
          verified: true,
        })),
      });
    }

    return updated;
  });

  return entity;
}

