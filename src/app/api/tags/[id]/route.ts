import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

/** Admin: change a tag's English and Spanish names. Its slug and category stay the same. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const nameEn = typeof body?.nameEn === "string" ? body.nameEn.trim() : "";
      const nameEs = typeof body?.nameEs === "string" ? body.nameEs.trim() : "";
      if (!nameEn || !nameEs) {
        return createErrorResponse("Both English and Spanish names are required", 400);
      }
      if (nameEn.length > 60 || nameEs.length > 60) {
        return createErrorResponse("Tag names can be at most 60 characters", 400);
      }

      const tag = await prisma.tag.findUnique({ where: { id }, select: { id: true } });
      if (!tag) return createErrorResponse("Tag not found", 404);
      const clash = await prisma.tag.findFirst({ where: { name: nameEn, NOT: { id } }, select: { id: true } });
      if (clash) return createErrorResponse("Another tag already has that name", 409);

      const updated = await prisma.tag.update({
        where: { id },
        data: { name: nameEn, nameTranslations: { en: nameEn, es: nameEs } },
      });
      return createSuccessResponse(updated, "Tag updated");
    } catch (error) {
      console.error("Error updating tag:", error);
      return createErrorResponse("Failed to update tag", 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
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

