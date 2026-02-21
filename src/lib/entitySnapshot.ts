import { normalizeEntityInput } from "@/lib/normalizeEntityInput";
import { generateSlug } from "@/lib/utils";
import type { BusinessHours, SocialMediaLinks } from "@/types";
import type { EntityType } from "@/generated/prisma/client";

export interface EntitySnapshot {
  name: string;
  slug?: string;
  description?: string | null;
  descriptionTranslations?: Record<string, string> | null;
  nameTranslations?: Record<string, string> | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerId?: string;
  entityType?: EntityType;
  hours?: BusinessHours | null;
  socialMedia?: SocialMediaLinks | null;
  displaySettings?: Record<string, boolean | undefined> | null;
  categorySlugs: string[];
  tagSlugs?: string[];
  images?: unknown;
  seoTitleTranslations?: Record<string, string> | null;
  seoDescriptionTranslations?: Record<string, string> | null;
}

/**
 * Normalize an incoming snapshot:
 * - trim/null contact fields
 * - clean social/hours/display settings
 * - ensure slug exists (but not necessarily unique)
 */
export function normalizeSnapshot(input: EntitySnapshot): EntitySnapshot {
  const normalized = normalizeEntityInput(input);

  const slug = input.slug && input.slug.trim() ? input.slug.trim() : generateSlug(input.name);

  const cleanTranslations = (obj?: Record<string, string> | null) => {
    if (!obj || typeof obj !== "object") return null;
    const cleaned: Record<string, string> = {};
    for (const [locale, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim()) {
        cleaned[locale] = value.trim();
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  };

  return {
    ...normalized,
    slug,
    ownerId: input.ownerId,
    descriptionTranslations: cleanTranslations(input.descriptionTranslations),
    nameTranslations: cleanTranslations(input.nameTranslations),
    seoTitleTranslations: cleanTranslations(input.seoTitleTranslations),
    seoDescriptionTranslations: cleanTranslations(input.seoDescriptionTranslations),
    categorySlugs: input.categorySlugs || [],
    tagSlugs: input.tagSlugs || [],
  };
}

