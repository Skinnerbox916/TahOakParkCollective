import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { proposeUpdate } from "@/lib/entities";
import { ROLE } from "@/lib/prismaEnums";
import { deleteUpload, detectImageType, keyFromPublicUrl, saveUpload } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Admin-only for now. Uploads publish immediately, so owner uploads need to go
// through the approval workflow first. No page calls this route yet: the
// current entity editor (EntityPreview) has no image section.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const type = searchParams.get("type"); // 'logo' | 'hero'

      if (!type || !["logo", "hero"].includes(type)) {
        return createErrorResponse("Invalid upload type. Must be 'logo' or 'hero'", 400);
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return createErrorResponse("File is required", 400);
      }

      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse("File size exceeds 5MB limit", 400);
      }

      const entity = await prisma.entity.findUnique({
        where: { id },
        select: { id: true, images: true },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = detectImageType(buffer);
      if (!extension) {
        return createErrorResponse("Invalid file type. Allowed: JPEG, PNG, WebP", 400);
      }

      // Unique name per upload: no cache busting needed, and a committed file
      // in public/uploads can never shadow a new upload.
      const key = `entities/${id}/${type}-${Date.now()}.${extension}`;
      const publicPath = await saveUpload(key, buffer);

      const currentImages = (entity.images as Record<string, string> | null) || {};
      const previousKey = currentImages[type] ? keyFromPublicUrl(currentImages[type]) : null;

      try {
        await proposeUpdate(user, id, { images: { ...currentImages, [type]: publicPath } }, { source: "admin" });
      } catch (error) {
        await deleteUpload(key).catch(() => {});
        throw error;
      }

      if (previousKey && previousKey !== key) {
        await deleteUpload(previousKey).catch((error) =>
          console.warn("Could not delete replaced upload:", previousKey, error)
        );
      }

      return createSuccessResponse({ path: publicPath }, "Image uploaded successfully");
    } catch (error) {
      return entityErrorResponse(error, "Failed to upload image");
    }
  });
}
