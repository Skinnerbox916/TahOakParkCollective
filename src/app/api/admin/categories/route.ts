import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { fetchCategories } from "@/lib/category-helpers";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const categories = await fetchCategories({
        includeInactive: true,
        requireEntityTypes: false,
      });

      return createSuccessResponse(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return createErrorResponse("Failed to fetch categories", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const body = await request.json();
      const { id, featured, nameTranslations, descriptionTranslations } = body;

      if (!id) {
        return createErrorResponse("Category ID is required", 400);
      }

      const updateData: any = {};
      
      if (featured !== undefined) {
        updateData.featured = Boolean(featured);
      }
      
      if (nameTranslations !== undefined) {
        updateData.nameTranslations = nameTranslations;
      }
      
      if (descriptionTranslations !== undefined) {
        updateData.descriptionTranslations = descriptionTranslations;
      }

      if (Object.keys(updateData).length === 0) {
        return createErrorResponse("At least one field (featured, nameTranslations, descriptionTranslations) is required", 400);
      }

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              entities: true,
            },
          },
        },
      });

      return createSuccessResponse(category, "Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      return createErrorResponse("Failed to update category", 500);
    }
  });
}



