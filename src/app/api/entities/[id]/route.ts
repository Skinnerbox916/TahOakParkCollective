import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entity = await prisma.entity.findUnique({
      where: { id },
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

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    return createSuccessResponse(entity);
  } catch (error) {
    console.error("Error fetching entity:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, description, address, phone, website, categoryId, status, entityType } = body;

      // Check if entity exists
      const existingEntity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!existingEntity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && existingEntity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only update your own entity", 403);
      }

      // Restrict status changes to admins only
      if (status !== undefined && !user.roles.includes(ROLE.ADMIN)) {
        return createErrorResponse("Forbidden: Only admins can change entity status", 403);
      }

      // Build update data, excluding status if user is not admin
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      if (entityType !== undefined) updateData.entityType = entityType;
      // Only include status if user is admin
      if (status !== undefined && user.roles.includes(ROLE.ADMIN)) {
        updateData.status = status;
      }

      const entity = await prisma.entity.update({
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

      return createSuccessResponse(entity, "Entity updated successfully");
    } catch (error) {
      console.error("Error updating entity:", error);
      return createErrorResponse("Failed to update entity", 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;

      // Check if entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only delete your own entity", 403);
      }

      await prisma.entity.delete({
        where: { id },
      });

      return createSuccessResponse(null, "Entity deleted successfully");
    } catch (error) {
      console.error("Error deleting entity:", error);
      return createErrorResponse("Failed to delete entity", 500);
    }
  });
}

