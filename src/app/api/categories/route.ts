import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const entityType = request.nextUrl.searchParams.get("entityType");
    
    const where: any = {};
    if (entityType) {
      where.entityTypes = {
        has: entityType,
      };
    }

    // Only return categories that have entityTypes set (part of the new entity-type system)
    const categories = await prisma.category.findMany({
      where: {
        ...where,
        entityTypes: {
          isEmpty: false, // Only categories with entityTypes
        },
      },
      include: {
        _count: {
          select: {
            entities: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Add entity count to each category
    const categoriesWithCounts = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      featured: category.featured,
      entityTypes: category.entityTypes || [],
      entityCount: category._count?.entities || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return createSuccessResponse(categoriesWithCounts);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return createErrorResponse(
      `Failed to fetch categories: ${error?.message || "Unknown error"}`,
      500
    );
  }
}





