import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth, withRole } from "@/lib/api-helpers";
import { ROLE, TagCategory } from "@/lib/prismaEnums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tags = await prisma.entityTag.findMany({
      where: { entityId: id },
      include: {
        tag: true,
      },
    });

    return createSuccessResponse(tags);
  } catch (error) {
    console.error("Error fetching entity tags:", error);
    return createErrorResponse("Failed to fetch entity tags", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { tagId } = body;

      if (!tagId) {
        return createErrorResponse("Tag ID is required", 400);
      }

      // Verify entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check ownership
      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You do not own this entity", 403);
      }

      // Get the tag to check category
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
      });

      if (!tag) {
        return createErrorResponse("Tag not found", 404);
      }

      // Check if already tagged
      const existing = await prisma.entityTag.findUnique({
        where: {
          entityId_tagId: {
            entityId: id,
            tagId,
          },
        },
      });

      if (existing) {
        return createErrorResponse("Entity already has this tag", 409);
      }

      // Determine verification status
      // FRIENDLINESS tags require admin verification
      // Unless the user IS an admin
      let verified = true;
      if (tag.category === TagCategory.FRIENDLINESS && !user.roles.includes(ROLE.ADMIN)) {
        verified = false;
      }

      const entityTag = await prisma.entityTag.create({
        data: {
          entityId: id,
          tagId,
          verified,
          createdBy: user.id,
        },
        include: {
          tag: true,
        },
      });

      return createSuccessResponse(entityTag, "Tag added successfully");
    } catch (error) {
      console.error("Error adding tag to entity:", error);
      return createErrorResponse("Failed to add tag", 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // entityId
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const tagId = searchParams.get("tagId");

      if (!tagId) {
        return createErrorResponse("Tag ID is required", 400);
      }

      // Verify entity exists and ownership
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden", 403);
      }

      // Delete the relation
      await prisma.entityTag.delete({
        where: {
          entityId_tagId: {
            entityId: id,
            tagId,
          },
        },
      });

      return createSuccessResponse(null, "Tag removed successfully");
    } catch (error) {
      console.error("Error removing tag:", error);
      // Check for P2025 (Record not found)
      if ((error as any).code === 'P2025') {
        return createErrorResponse("Tag not found on this entity", 404);
      }
      return createErrorResponse("Failed to remove tag", 500);
    }
  });
}


