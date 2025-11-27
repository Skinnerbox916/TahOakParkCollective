import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
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

    // Add business count and translated fields to each category
    const categoriesWithCounts = featuredCategories.map((category) => ({
      id: category.id,
      name: getTranslatedField(category.nameTranslations, locale, category.name),
      slug: category.slug,
      description: category.description
        ? getTranslatedField(category.descriptionTranslations, locale, category.description)
        : null,
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



