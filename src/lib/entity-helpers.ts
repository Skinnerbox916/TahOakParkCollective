import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { getTranslatedField } from "@/lib/translations";
import { searchEntityIds } from "@/lib/search-entities";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";

/**
 * Includes for anything a visitor can see: categories and tags, no owner.
 * Use this for every unauthenticated read (public API routes, public pages).
 */
export const entityIncludePublic = {
  categories: true,
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

/**
 * Includes for admin and member views: adds who manages the listing (names
 * and emails). Never use this in a response an anonymous visitor can receive.
 */
export const entityIncludeWithMembers = {
  ...entityIncludePublic,
  members: {
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} as const;

/** Entity fields only admins should see. */
const ADMIN_ONLY_ENTITY_FIELDS = [
  "verificationContact",
  "consentedById",
  // Who agreed for a listing an admin published for its owner: a person's name.
  "consentRecordedById",
  "consentGivenBy",
  "consentMethod",
  "consentNote",
] as const;

/** A copy of `entity` without the admin-only fields, for anyone who isn't an admin. */
export function withoutAdminFields<T extends Record<string, unknown>>(entity: T): T {
  const copy: Record<string, unknown> = { ...entity };
  for (const field of ADMIN_ONLY_ENTITY_FIELDS) delete copy[field];
  return copy as T;
}

/**
 * Transforms an entity with translations for entity, categories, and tags.
 * Admin-only fields are dropped unless includeAdminFields is true.
 */
export function transformEntity(entity: any, locale: string, includeAdminFields = false) {
  // Translate entity name and description
  const translatedName = getTranslatedField(entity.nameTranslations, locale, entity.name);
  const translatedDescription = entity.description
    ? getTranslatedField(entity.descriptionTranslations, locale, entity.description)
    : null;

  const translatedEntity: any = {
    ...entity,
    // Preserve canonical fields; expose localized variants separately
    nameLocalized: translatedName,
    descriptionLocalized: translatedDescription,
    // SEO fields (these are inherently localized, so keep existing behavior)
    seoTitle: getTranslatedField(entity.seoTitleTranslations, locale, translatedName),
    seoDescription: getTranslatedField(entity.seoDescriptionTranslations, locale, translatedDescription || translatedName),
  };

  // Translate categories if present
  if (entity.categories && Array.isArray(entity.categories)) {
    translatedEntity.categories = entity.categories.map((cat: any) => ({
      ...cat,
      nameLocalized: getTranslatedField(cat.nameTranslations, locale, cat.name),
      descriptionLocalized: cat.description
        ? getTranslatedField(cat.descriptionTranslations, locale, cat.description)
        : null,
    }));
  }

  // Translate tags if present
  if (entity.tags && Array.isArray(entity.tags)) {
    translatedEntity.tags = entity.tags.map((entityTag: any) => {
      if (entityTag.tag) {
        return {
          ...entityTag,
          tag: {
            ...entityTag.tag,
            nameLocalized: getTranslatedField(entityTag.tag.nameTranslations, locale, entityTag.tag.name),
          },
        };
      }
      return entityTag;
    });
  }

  // Handle legacy single category field if present
  if (entity.category) {
    translatedEntity.category = {
      ...entity.category,
      nameLocalized: getTranslatedField(entity.category.nameTranslations, locale, entity.category.name),
      descriptionLocalized: entity.category.description
        ? getTranslatedField(entity.category.descriptionTranslations, locale, entity.category.description)
        : null,
    };
  }

  if (!includeAdminFields) {
    for (const field of ADMIN_ONLY_ENTITY_FIELDS) {
      delete translatedEntity[field];
    }
  }

  return translatedEntity;
}

interface EntityWhereOptions {
  status?: EntityStatus | null;
  categoryId?: string | null;
  category?: string | null; // slug
  entityType?: EntityType | null;
  featured?: boolean;
  searchQuery?: string | null;
}

/**
 * Builds where clause for entity queries from common options
 */
export async function buildEntityWhereClause(
  options: EntityWhereOptions
): Promise<any> {
  const {
    status,
    categoryId,
    category,
    entityType,
    featured,
    searchQuery,
  } = options;

  const where: any = {};

  // Status filter
  if (status) {
    where.status = status;
  } else if (status === null || status === undefined) {
    // Default to only active entities for public queries
    // (callers can explicitly pass status to override)
    where.status = ENTITY_STATUS.ACTIVE;
  }

  // Featured filter
  if (featured) {
    where.featured = true;
  }

  // Entity type filter
  if (entityType) {
    where.entityType = entityType;
  }

  // Owner filter

  // Category filter (many-to-many)
  let finalCategoryId = categoryId || null;
  if (!finalCategoryId && category) {
    const categoryBySlug = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (categoryBySlug) {
      finalCategoryId = categoryBySlug.id;
    } else {
      finalCategoryId = category;
    }
  }
  if (finalCategoryId) {
    where.categories = { some: { id: finalCategoryId } };
  }

  // Free-text search (English and Spanish, ignoring accents): src/lib/search-entities.ts
  if (searchQuery && searchQuery.trim()) {
    where.id = { in: await searchEntityIds(searchQuery) };
  }

  return where;
}
