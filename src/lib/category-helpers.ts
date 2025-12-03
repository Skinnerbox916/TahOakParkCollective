import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { getTranslatedField } from "@/lib/translations";
import type { EntityType } from "@/lib/prismaEnums";

/**
 * Prisma include object for fetching active entity counts
 * This ensures we only count ACTIVE entities (fixes the bug where inactive entities were being counted)
 */
export const categoryIncludeActiveEntityCount = {
  _count: {
    select: {
      entities: {
        where: {
          status: ENTITY_STATUS.ACTIVE,
        },
      },
    },
  },
} as const;

/**
 * Prisma include object for fetching all entity counts (admin use)
 */
export const categoryIncludeAllEntityCount = {
  _count: {
    select: {
      entities: true,
    },
  },
} as const;

interface CategoryQueryOptions {
  featured?: boolean;
  entityType?: EntityType | null;
  includeInactive?: boolean; // For admin views - includes inactive entities in count
  requireEntityTypes?: boolean; // Whether to filter categories without entityTypes
}

/**
 * Fetches categories with consistent filtering and entity counts
 */
export async function fetchCategories(options: CategoryQueryOptions = {}) {
  const {
    featured,
    entityType,
    includeInactive = false,
    requireEntityTypes = true,
  } = options;

  const where: any = {};

  if (featured) {
    where.featured = true;
  }

  if (entityType) {
    where.entityTypes = {
      has: entityType,
    };
  }

  if (requireEntityTypes) {
    where.entityTypes = {
      isEmpty: false,
    };
  }

  return prisma.category.findMany({
    where,
    include: includeInactive
      ? categoryIncludeAllEntityCount
      : categoryIncludeActiveEntityCount,
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Transforms a category with translations and entity count
 */
export function transformCategory(category: any, locale: string) {
  return {
    id: category.id,
    name: getTranslatedField(category.nameTranslations, locale, category.name),
    slug: category.slug,
    description: category.description
      ? getTranslatedField(category.descriptionTranslations, locale, category.description)
      : null,
    featured: category.featured,
    entityTypes: category.entityTypes || [],
    entityCount: category._count?.entities || 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

/**
 * Fetches and transforms categories in one call
 */
export async function fetchAndTransformCategories(
  locale: string,
  options: CategoryQueryOptions = {}
) {
  const categories = await fetchCategories(options);
  return categories.map((category) => transformCategory(category, locale));
}

