import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ENTITY_OWNER, ROLE.ADMIN], async (user) => {
    try {
      const entities = await prisma.entity.findMany({
        where: {
          ownerId: user.id,
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return createSuccessResponse(entities);
    } catch (error) {
      console.error("Error fetching user entities:", error);
      return createErrorResponse("Failed to fetch entities", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.ENTITY_OWNER, ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Entity ID is required", 400);
      }

      // Verify the user owns this entity (unless admin)
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden", 403);
      }

      const updated = await prisma.entity.update({
        where: { id },
        data: updateData,
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

      return createSuccessResponse(updated, "Entity updated successfully");
    } catch (error) {
      console.error("Error updating entity:", error);
      return createErrorResponse("Failed to update entity", 500);
    }
  });
}

