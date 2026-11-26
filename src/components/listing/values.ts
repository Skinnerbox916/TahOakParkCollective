/**
 * The listing editor's form state, and how it maps to and from the API.
 *
 * One shape for every mode (create, edit, review). Categories and tags are
 * slugs, which is what the write service takes (src/lib/entities). The
 * English name and description are the plain fields; the editor only edits
 * the Spanish translation (the server mirrors English, see mirrorEnglish).
 */
import type { BusinessHours, SocialMediaLinks } from "@/types";
import { ENTITY_STATUS, ENTITY_TYPE, type EntityStatus, type EntityType } from "@/lib/prismaEnums";
import type { SocialPlatform } from "@/lib/entityFormConfig";

export const DISPLAY_FIELDS = ["address", "phone", "website", "hours", "socialMedia", "location"] as const;
export type DisplayField = (typeof DISPLAY_FIELDS)[number];
export type DisplaySettings = Record<DisplayField, boolean>;

export interface ListingValues {
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  entityType: EntityType;
  categorySlugs: string[];
  tagSlugs: string[];
  address: string;
  phone: string;
  website: string;
  hours: BusinessHours;
  socialMedia: SocialMediaLinks;
  display: DisplaySettings;
  // Admin only
  status: EntityStatus;
  slug: string;
  ownerId: string;
}

export type EditorMode = "create" | "edit" | "review";
export type EditorRole = "admin" | "owner";

const allShown = (): DisplaySettings =>
  Object.fromEntries(DISPLAY_FIELDS.map((f) => [f, true])) as DisplaySettings;

export function emptyValues(): ListingValues {
  return {
    name: "",
    nameEs: "",
    description: "",
    descriptionEs: "",
    entityType: ENTITY_TYPE.COMMERCE,
    categorySlugs: [],
    tagSlugs: [],
    address: "",
    phone: "",
    website: "",
    hours: {},
    socialMedia: {},
    display: allShown(),
    status: ENTITY_STATUS.ACTIVE,
    slug: "",
    ownerId: "",
  };
}

type Source = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" ? v : "");
const spanish = (v: unknown) => text((v as Record<string, unknown> | null)?.es);

/**
 * Form values from a listing as GET /api/entities/[id] returns it, or from an
 * approval's proposedState (which already uses categorySlugs/tagSlugs).
 */
export function valuesFrom(source: Source): ListingValues {
  const base = emptyValues();
  const categories = Array.isArray(source.categorySlugs)
    ? (source.categorySlugs as string[])
    : ((source.categories as { slug: string }[] | undefined) ?? []).map((c) => c.slug);
  const tags = Array.isArray(source.tagSlugs)
    ? (source.tagSlugs as string[])
    : ((source.tags as { tag: { slug: string } }[] | undefined) ?? []).map((t) => t.tag.slug);
  const stored = (source.displaySettings ?? {}) as Partial<DisplaySettings>;

  return {
    ...base,
    name: text(source.name),
    nameEs: spanish(source.nameTranslations),
    description: text(source.description),
    descriptionEs: spanish(source.descriptionTranslations),
    entityType: (source.entityType as EntityType) || base.entityType,
    categorySlugs: [...categories].sort(),
    tagSlugs: [...tags].sort(),
    address: text(source.address),
    phone: text(source.phone),
    website: text(source.website),
    hours: (source.hours as BusinessHours) ?? {},
    socialMedia: (source.socialMedia as SocialMediaLinks) ?? {},
    display: Object.fromEntries(DISPLAY_FIELDS.map((f) => [f, stored[f] ?? true])) as DisplaySettings,
    status: (source.status as EntityStatus) || base.status,
    slug: text(source.slug),
  };
}

/** The listing's stored images, as the editor's image fields take them. */
export function imagesFrom(source: Source): { logo: string | null; cover: string | null } {
  const images = (source.images ?? {}) as Record<string, unknown>;
  return { logo: text(images.logo) || null, cover: text(images.hero) || null };
}

const sameDisplay = (a: DisplaySettings, b: DisplaySettings) => DISPLAY_FIELDS.every((f) => a[f] === b[f]);

/** Social links for the platforms the form shows; hidden ones are dropped. */
export function visibleSocial(links: SocialMediaLinks, platforms: SocialPlatform[]): SocialMediaLinks {
  return Object.fromEntries(platforms.filter((p) => links[p]?.trim()).map((p) => [p, links[p]!.trim()]));
}

/**
 * The request body for the write service. Only display settings that changed
 * are sent: a stored null and "all shown" mean the same thing, and sending
 * them anyway made untouched saves look like edits.
 */
export function toPayload(
  values: ListingValues,
  initial: ListingValues,
  opts: {
    mode: EditorMode;
    role: EditorRole;
    platforms: SocialPlatform[];
    hoursEnabled: boolean;
    statusEditable: boolean;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: values.name,
    nameTranslations: { es: values.nameEs },
    description: values.description,
    descriptionTranslations: { es: values.descriptionEs },
    entityType: values.entityType,
    categorySlugs: values.categorySlugs,
    tagSlugs: values.tagSlugs,
    address: values.address,
    phone: values.phone,
    website: values.website,
    socialMedia: visibleSocial(values.socialMedia, opts.platforms),
  };
  // A type without hours (parks, civic) keeps whatever hours it had.
  if (opts.hoursEnabled) payload.hours = values.hours;
  if (!sameDisplay(values.display, initial.display)) payload.displaySettings = values.display;

  if (opts.role === "admin") {
    if (opts.statusEditable) payload.status = values.status;
    if (opts.mode === "create" && values.ownerId) payload.ownerId = values.ownerId;
    if (opts.mode === "edit" && values.slug && values.slug !== initial.slug) payload.slug = values.slug;
  }
  return payload;
}
