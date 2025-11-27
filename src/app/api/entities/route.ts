import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { BUSINESS_STATUS, ROLE, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { BusinessStatus, EntityType } from "@/lib/prismaEnums";
import { expandSearchQuery, getMatchingCategories } from "@/lib/keyword-search";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as BusinessStatus | null;
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category"); 
    const entityType = searchParams.get("entityType") as EntityType | null;
    const searchQuery = searchParams.get("q") || searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "random"; // Default to random

    const where: any = {};
    
    if (status) {
      where.status = status;
    } else {
      // Default to only active entities for public
      where.status = BUSINESS_STATUS.ACTIVE;
    }

    if (featured) {
      where.featured = true;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    // Category Logic (many-to-many)
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

    // Search Logic
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      const expandedTerms = expandSearchQuery(searchTerm);
      const matchingCategorySlugs = getMatchingCategories(searchTerm);
      
      let matchingCategoryIds: string[] = [];
      if (matchingCategorySlugs.length > 0) {
        const categories = await prisma.category.findMany({
          where: { slug: { in: matchingCategorySlugs } },
          select: { id: true },
        });
        matchingCategoryIds = categories.map(c => c.id);
      }

      const searchConditions: any[] = [];
      expandedTerms.forEach(term => {
        searchConditions.push(
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } }
        );
      });

      if (matchingCategoryIds.length > 0) {
        searchConditions.push({ categories: { some: { id: { in: matchingCategoryIds } } } });
      }

      where.OR = searchConditions;
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" }; // Default fallback
    if (sort === "name") {
      orderBy = { name: "asc" };
    } else if (sort === "featured") {
      orderBy = [{ featured: "desc" }, { name: "asc" }];
    }
    // If sort === 'random', we'll handle it in memory after fetch

    const entities = await prisma.entity.findMany({
      where,
      include: {
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
            tag: true
          }
        }
      },
      orderBy: sort !== "random" ? orderBy : undefined,
    });

    // Handle random sort in memory
    if (sort === "random") {
      for (let i = entities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entities[i], entities[j]] = [entities[j], entities[i]];
      }
    }

    // Map entities to include translated content
    const translatedEntities = entities.map((entity) => {
      // Translate entity name and description
      const translatedEntity = {
        ...entity,
        name: getTranslatedField(entity.nameTranslations, locale, entity.name),
        description: entity.description
          ? getTranslatedField(entity.descriptionTranslations, locale, entity.description)
          : null,
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

      return translatedEntity;
    });

    return createSuccessResponse(translatedEntities);
  } catch (error: any) {
    console.error("Error fetching entities:", error);
    return createErrorResponse(
      `Failed to fetch entities: ${error?.message || "Unknown error"}`,
      500
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const { name, description, address, phone, website, categoryIds, ownerId, entityType, socialMedia } = body;

      if (!name) {
        return createErrorResponse("Entity name is required", 400);
      }

      // Determine the owner ID
      let finalOwnerId = user.id;
      if (ownerId && user.roles.includes(ROLE.ADMIN)) {
        const owner = await prisma.user.findUnique({
          where: { id: ownerId },
        });
        if (!owner) {
          return createErrorResponse("Specified owner not found", 400);
        }
        finalOwnerId = ownerId;
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Ensure unique slug
      let check = await prisma.entity.findUnique({
        where: { slug },
      });

      let uniqueSlug = slug;
      let counter = 1;
      while (check) {
        uniqueSlug = `${slug}-${counter}`;
        check = await prisma.entity.findUnique({
          where: { slug: uniqueSlug },
        });
        counter++;
      }

      const status = user.roles.includes(ROLE.ADMIN) && body.status 
        ? body.status 
        : BUSINESS_STATUS.PENDING;

      const finalEntityType = entityType || ENTITY_TYPE.COMMERCE;

      // Clean social media - remove empty values
      let cleanedSocialMedia = null;
      if (socialMedia && typeof socialMedia === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(socialMedia)) {
          if (value && typeof value === 'string' && value.trim()) {
            cleaned[key] = value.trim();
          }
        }
        cleanedSocialMedia = Object.keys(cleaned).length > 0 ? cleaned : null;
      }

      const entity = await prisma.entity.create({
        data: {
          name,
          slug: uniqueSlug,
          description,
          address,
          phone,
          website,
          categories: categoryIds?.length ? { connect: categoryIds.map((id: string) => ({ id })) } : undefined,
          entityType: finalEntityType,
          status,
          ownerId: finalOwnerId,
          socialMedia: cleanedSocialMedia,
        },
        include: {
          categories: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return createSuccessResponse(entity, "Entity created successfully");
    } catch (error) {
      console.error("Error creating entity:", error);
      return createErrorResponse("Failed to create entity", 500);
    }
  });
}
