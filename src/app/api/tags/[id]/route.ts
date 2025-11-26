import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;

      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          entities: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!tag) {
        return createErrorResponse("Tag not found", 404);
      }

      // Check if tag is being used by any entities
      const entityCount = tag.entities.length;

      // Delete the tag (EntityTags will cascade delete automatically)
      await prisma.tag.delete({
        where: { id },
      });

      return createSuccessResponse(
        null,
        `Tag deleted successfully.${entityCount > 0 ? ` ${entityCount} entity association(s) were automatically removed.` : ""}`
      );
    } catch (error) {
      console.error("Error deleting tag:", error);
      return createErrorResponse("Failed to delete tag", 500);
    }
  });
}

