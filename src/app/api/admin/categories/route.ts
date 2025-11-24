import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              businesses: true,
            },
          },
        },
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
      const { id, featured } = body;

      if (!id) {
        return createErrorResponse("Category ID is required", 400);
      }

      if (featured === undefined) {
        return createErrorResponse("Featured field is required", 400);
      }

      const category = await prisma.category.update({
        where: { id },
        data: { featured: Boolean(featured) },
        include: {
          _count: {
            select: {
              businesses: true,
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



