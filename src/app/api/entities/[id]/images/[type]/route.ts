import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { join } from "path";
import { unlink } from "fs/promises";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id, type } = await params;

      if (!["logo", "hero"].includes(type)) {
        return createErrorResponse("Invalid image type", 400);
      }

      // Verify ownership
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden", 403);
      }

      const currentImages = (entity.images as Record<string, string>) || {};
      
      if (!currentImages[type]) {
        return createErrorResponse("Image not found", 404);
      }

      // Try to delete file from filesystem
      // Parse the filename from the stored URL (e.g., /uploads/entities/ID/logo.png?t=...)
      const imagePath = currentImages[type];
      const urlPath = imagePath.split("?")[0]; // Remove query string
      const fileName = urlPath.split("/").pop(); // Get filename
      
      if (fileName) {
        const filePath = join(process.cwd(), "public", "uploads", "entities", id, fileName);
        console.log("Deleting file:", filePath);
        try {
          await unlink(filePath);
          console.log("File deleted successfully");
        } catch (e) {
          console.warn("File not found on disk:", filePath);
        }
      }

      // Update DB
      const updatedImages = { ...currentImages };
      delete updatedImages[type];

      await prisma.entity.update({
        where: { id },
        data: {
          images: updatedImages,
        },
      });

      return createSuccessResponse(null, "Image removed successfully");
    } catch (error) {
      console.error("Error removing image:", error);
      return createErrorResponse("Failed to remove image", 500);
    }
  });
}


