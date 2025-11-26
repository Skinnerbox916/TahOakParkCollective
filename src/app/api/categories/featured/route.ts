import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const featuredCategories = await prisma.category.findMany({
      where: {
        featured: true,
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

    // Add business count to each category
    const categoriesWithCounts = featuredCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      featured: category.featured,
      businessCount: category._count.entities,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return createSuccessResponse(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return createErrorResponse("Failed to fetch featured categories", 500);
  }
}



