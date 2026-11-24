import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { proposeUpdate } from "@/lib/entities";
import { ROLE } from "@/lib/prismaEnums";
import { deleteUpload, keyFromPublicUrl } from "@/lib/storage";

// Admin-only, matching the upload route: removing an image publishes
// immediately, so owner changes need to go through approvals first.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id, type } = await params;

      if (!["logo", "hero"].includes(type)) {
        return createErrorResponse("Invalid image type", 400);
      }

      const entity = await prisma.entity.findUnique({
        where: { id },
        select: { id: true, images: true },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      const currentImages = (entity.images as Record<string, string> | null) || {};

      if (!currentImages[type]) {
        return createErrorResponse("Image not found", 404);
      }

      const updatedImages = { ...currentImages };
      delete updatedImages[type];

      await proposeUpdate(user, id, { images: updatedImages }, { source: "admin" });

      // Files from before UPLOAD_DIR existed live in public/ and are left alone;
      // keyFromPublicUrl still maps them, but deleteUpload only touches
      // UPLOAD_DIR and ignores missing files.
      const key = keyFromPublicUrl(currentImages[type]);
      if (key) {
        await deleteUpload(key).catch((error) =>
          console.warn("Could not delete upload:", key, error)
        );
      }

      return createSuccessResponse(null, "Image removed successfully");
    } catch (error) {
      return entityErrorResponse(error, "Failed to remove image");
    }
  });
}
