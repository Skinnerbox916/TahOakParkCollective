import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, BUSINESS_STATUS } from "@/lib/prismaEnums";
import type { BusinessStatus, LocalTier } from "@/lib/prismaEnums";
import { expandSearchQuery, getMatchingCategories } from "@/lib/keyword-search";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as BusinessStatus | null;
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("categoryId") || "";
      const localTier = searchParams.get("localTier") as LocalTier | null;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (localTier) {
        where.localTier = localTier;
      }

      if (search) {
        const expandedTerms = expandSearchQuery(search);
        const matchingCategorySlugs = getMatchingCategories(search);
        
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

        // Build OR conditions with expanded terms
        const searchConditions: any[] = [];
        
        expandedTerms.forEach(term => {
          searchConditions.push(
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { address: { contains: term, mode: "insensitive" } }
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

      const businesses = await prisma.entity.findMany({
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

      return createSuccessResponse(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      return createErrorResponse("Failed to fetch businesses", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { id, status, featured, localTier } = body;

      if (!id) {
        return createErrorResponse("Business ID is required", 400);
      }

      const updateData: any = {};

      if (status !== undefined) {
        if (!Object.values(BUSINESS_STATUS).includes(status)) {
          return createErrorResponse("Valid status is required", 400);
        }
        updateData.status = status;
      }

      if (featured !== undefined) {
        updateData.featured = Boolean(featured);
      }

      if (localTier !== undefined) {
        updateData.localTier = localTier || null;
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("At least one field (status, featured, or localTier) must be provided", 400);
      }

      const business = await prisma.entity.update({
        where: { id },
        data: updateData,
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

      return createSuccessResponse(business, "Business updated successfully");
    } catch (error) {
      console.error("Error updating business:", error);
      return createErrorResponse("Failed to update business", 500);
    }
  });
}

