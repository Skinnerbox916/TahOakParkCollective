import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { getTranslatedField } from "@/lib/translations";
import { expandSearchQuery, getMatchingCategories } from "@/lib/keyword-search";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";

/**
 * Standard includes for entity queries
 * Includes categories, owner (with selected fields), and tags
 */
export const entityIncludeStandard = {
  categories: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

/**
 * Transforms an entity with translations for entity, categories, and tags
 */
export function transformEntity(entity: any, locale: string) {
  // Translate entity name and description
  const translatedName = getTranslatedField(entity.nameTranslations, locale, entity.name);
  const translatedDescription = entity.description
    ? getTranslatedField(entity.descriptionTranslations, locale, entity.description)
    : null;

  const translatedEntity: any = {
    ...entity,
    name: translatedName,
    description: translatedDescription,
    // SEO fields with fallback to name/description
    seoTitle: getTranslatedField(
      entity.seoTitleTranslations,
      locale,
      translatedName
    ),
    seoDescription: getTranslatedField(
      entity.seoDescriptionTranslations,
      locale,
      translatedDescription || translatedName
    ),
  };

  // Translate categories if present
  if (entity.categories && Array.isArray(entity.categories)) {
    translatedEntity.categories = entity.categories.map((cat: any) => ({
      ...cat,
      name: getTranslatedField(cat.nameTranslations, locale, cat.name),
      description: cat.description
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
            name: getTranslatedField(
              entityTag.tag.nameTranslations,
              locale,
              entityTag.tag.name
            ),
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
      name: getTranslatedField(
        entity.category.nameTranslations,
        locale,
        entity.category.name
      ),
      description: entity.category.description
        ? getTranslatedField(
            entity.category.descriptionTranslations,
            locale,
            entity.category.description
          )
        : null,
    };
  }

  return translatedEntity;
}

interface EntityWhereOptions {
  status?: EntityStatus | null;
  categoryId?: string | null;
  category?: string | null; // slug
  entityType?: EntityType | null;
  featured?: boolean;
  ownerId?: string;
  searchQuery?: string | null;
}

/**
 * Builds search conditions with keyword expansion
 */
export async function buildEntitySearchWhere(searchQuery: string) {
  const searchTerm = searchQuery.trim();
  const expandedTerms = expandSearchQuery(searchTerm);
  const matchingCategorySlugs = getMatchingCategories(searchTerm);

  let matchingCategoryIds: string[] = [];
  if (matchingCategorySlugs.length > 0) {
    const categories = await prisma.category.findMany({
      where: { slug: { in: matchingCategorySlugs } },
      select: { id: true },
    });
    matchingCategoryIds = categories.map((c) => c.id);
  }

  const searchConditions: any[] = [];
  expandedTerms.forEach((term) => {
    searchConditions.push(
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } }
    );
  });

  if (matchingCategoryIds.length > 0) {
    searchConditions.push({
      categories: { some: { id: { in: matchingCategoryIds } } },
    });
  }

  return searchConditions;
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
    ownerId,
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
  if (ownerId) {
    where.ownerId = ownerId;
  }

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

  // Search query
  if (searchQuery && searchQuery.trim()) {
    const searchConditions = await buildEntitySearchWhere(searchQuery);
    where.OR = searchConditions;
  }

  return where;
}

/**
 * Builds search where clause for admin entity queries (includes address search)
 */
export async function buildAdminEntitySearchWhere(searchQuery: string) {
  const searchTerm = searchQuery.trim();
  const expandedTerms = expandSearchQuery(searchTerm);
  const matchingCategorySlugs = getMatchingCategories(searchTerm);

  let matchingCategoryIds: string[] = [];
  if (matchingCategorySlugs.length > 0) {
    const categories = await prisma.category.findMany({
      where: { slug: { in: matchingCategorySlugs } },
      select: { id: true },
    });
    matchingCategoryIds = categories.map((c) => c.id);
  }

  const searchConditions: any[] = [];
  expandedTerms.forEach((term) => {
    searchConditions.push(
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } }
    );
  });

  if (matchingCategoryIds.length > 0) {
    searchConditions.push({
      categories: { some: { id: { in: matchingCategoryIds } } },
    });
  }

  return searchConditions;
}

