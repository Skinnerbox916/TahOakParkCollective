import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth, withRole } from "@/lib/api-helpers";
import { BUSINESS_STATUS, ROLE, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { BusinessStatus, EntityType } from "@/lib/prismaEnums";
import { expandSearchQuery, getMatchingCategories } from "@/lib/keyword-search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as BusinessStatus | null;
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category"); // Also support "category" param
    const entityType = searchParams.get("entityType") as EntityType | null;
    const searchQuery = searchParams.get("q") || searchParams.get("search");
    const featured = searchParams.get("featured") === "true";

    const where: any = {};
    
    if (status) {
      where.status = status;
    } else {
      // Default to only active entities for public
      where.status = BUSINESS_STATUS.ACTIVE;
    }

    // Filter by featured flag
    if (featured) {
      where.featured = true;
    }

    // Filter by entity type
    if (entityType) {
      where.entityType = entityType;
    }

    // Use categoryId or category param
    const finalCategoryId = categoryId || category;
    if (finalCategoryId) {
      where.categoryId = finalCategoryId;
    }

    // Enhanced natural language search with keyword expansion
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      const expandedTerms = expandSearchQuery(searchTerm);
      const matchingCategorySlugs = getMatchingCategories(searchTerm);
      
      // Get category IDs for matching category slugs
      let matchingCategoryIds: string[] = [];
      if (matchingCategorySlugs.length > 0) {
        const categories = await prisma.category.findMany({
          where: {
            slug: {
              in: matchingCategorySlugs,
            },
          },
          select: {
            id: true,
          },
        });
        matchingCategoryIds = categories.map(c => c.id);
      }

      // Build OR conditions: search name/description with expanded terms AND search by matching category IDs
      const searchConditions: any[] = [];
      
      // Add text search conditions for each expanded term
      expandedTerms.forEach(term => {
        searchConditions.push(
          {
            name: {
              contains: term,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: term,
              mode: "insensitive",
            },
          }
        );
      });

      // Add category ID search if we found matching categories
      if (matchingCategoryIds.length > 0) {
        searchConditions.push({
          categoryId: {
            in: matchingCategoryIds,
          },
        });
      }

      where.OR = searchConditions;
    }

    const entities = await prisma.entity.findMany({
      where,
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return createSuccessResponse(entities);
  } catch (error: any) {
    console.error("Error fetching entities:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
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
      const { name, description, address, phone, website, categoryId, ownerId, entityType } = body;

      if (!name) {
        return createErrorResponse("Entity name is required", 400);
      }

      // Determine the owner ID
      // Admins can specify an ownerId, otherwise use the authenticated user's ID
      let finalOwnerId = user.id;
      if (ownerId && user.roles.includes(ROLE.ADMIN)) {
        // Verify the owner exists
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

      // Admins can set status directly, others default to PENDING
      const status = user.roles.includes(ROLE.ADMIN) && body.status 
        ? body.status 
        : BUSINESS_STATUS.PENDING;

      // Default entityType to COMMERCE if not provided
      const finalEntityType = entityType || ENTITY_TYPE.COMMERCE;

      const entity = await prisma.entity.create({
        data: {
          name,
          slug: uniqueSlug,
          description,
          address,
          phone,
          website,
          categoryId: categoryId || null,
          entityType: finalEntityType,
          status,
          ownerId: finalOwnerId,
        },
        include: {
          category: true,
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

