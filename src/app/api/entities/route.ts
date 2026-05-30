import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ENTITY_STATUS, ROLE, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludeStandard, transformEntity, buildEntityWhereClause } from "@/lib/entity-helpers";
import { validateEntityInput } from "@/lib/schemas/entitySchema";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as EntityStatus | null;
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category"); 
    const entityType = searchParams.get("entityType") as EntityType | null;
    const searchQuery = searchParams.get("q") || searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "random"; // Default to random

    // Build where clause using helper
    const where = await buildEntityWhereClause({
      status,
      categoryId: categoryId || null,
      category: category || null,
      entityType,
      featured,
      searchQuery: searchQuery || null,
    });

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
      include: entityIncludeStandard,
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
    const translatedEntities = entities.map((entity) => transformEntity(entity, locale));

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
      const { name, description, address, phone, website, categoryIds, ownerId, entityType, socialMedia, hours, tagIds, seoTitleTranslations, seoDescriptionTranslations } = body;

      const validation = validateEntityInput({
        name,
        description,
        address,
        phone,
        website,
        socialMedia,
        hours,
      });

      if (!validation.success) {
        const firstError = Object.values(validation.fieldErrors)[0];
        return createErrorResponse(firstError || validation.error, 400, validation.fieldErrors);
      }

      const normalized = validation.data;

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
      const slug = normalized.name
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

      // Only admins can directly create entities; they default to ACTIVE unless specified
      // Non-admin entity creation should go through the approval workflow
      const status = user.roles.includes(ROLE.ADMIN) && body.status 
        ? body.status 
        : ENTITY_STATUS.ACTIVE;

      const finalEntityType = entityType || ENTITY_TYPE.COMMERCE;

      const cleanedSocialMedia = normalized.socialMedia ?? null;
      const cleanedHours = normalized.hours ?? null;

      // Clean SEO translation fields - validate JSON structure
      let cleanedSeoTitleTranslations = null;
      if (seoTitleTranslations && typeof seoTitleTranslations === 'object') {
        const cleaned: any = {};
        for (const [locale, value] of Object.entries(seoTitleTranslations)) {
          if (value && typeof value === 'string' && value.trim()) {
            cleaned[locale] = value.trim();
          }
        }
        cleanedSeoTitleTranslations = Object.keys(cleaned).length > 0 ? cleaned : null;
      }

      let cleanedSeoDescriptionTranslations = null;
      if (seoDescriptionTranslations && typeof seoDescriptionTranslations === 'object') {
        const cleaned: any = {};
        for (const [locale, value] of Object.entries(seoDescriptionTranslations)) {
          if (value && typeof value === 'string' && value.trim()) {
            cleaned[locale] = value.trim();
          }
        }
        cleanedSeoDescriptionTranslations = Object.keys(cleaned).length > 0 ? cleaned : null;
      }

      // Use transaction to create entity and tags atomically
      const entity = await prisma.$transaction(async (tx) => {
        // Create the entity
        const newEntity = await tx.entity.create({
          data: {
            name: normalized.name,
            slug: uniqueSlug,
            description: normalized.description,
            address: normalized.address,
            phone: normalized.phone,
            website: normalized.website,
            categories: categoryIds?.length ? { connect: categoryIds.map((id: string) => ({ id })) } : undefined,
            entityType: finalEntityType,
            status,
            ownerId: finalOwnerId,
            socialMedia: cleanedSocialMedia ?? Prisma.DbNull,
            hours: cleanedHours ?? Prisma.DbNull,
            seoTitleTranslations: cleanedSeoTitleTranslations,
            seoDescriptionTranslations: cleanedSeoDescriptionTranslations,
          },
        });

        // Create tags if provided
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
          await tx.entityTag.createMany({
            data: tagIds.map((tagId: string) => ({
              entityId: newEntity.id,
              tagId,
              verified: true,
              createdBy: finalOwnerId,
            })),
          });
        }

        // Return entity with all relations
        return tx.entity.findUnique({
          where: { id: newEntity.id },
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
                tag: true,
              },
            },
          },
        });
      });

      return createSuccessResponse(entity, "Entity created successfully");
    } catch (error) {
      console.error("Error creating entity:", error);
      return createErrorResponse("Failed to create entity", 500);
    }
  });
}
