import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const type = searchParams.get("type"); // 'logo' | 'hero'

      if (!type || !["logo", "hero"].includes(type)) {
        return createErrorResponse("Invalid upload type. Must be 'logo' or 'hero'", 400);
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return createErrorResponse("File is required", 400);
      }

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse("File size exceeds 5MB limit", 400);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return createErrorResponse("Invalid file type. Allowed: JPEG, PNG, WebP", 400);
      }

      // Verify ownership
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only upload images for your own entity", 403);
      }

      // Get file buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("Received file:", file.name, "size:", buffer.length, "type:", file.type);
      
      // Determine file extension from original file type
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png", 
        "image/webp": "webp"
      };
      const ext = extMap[file.type] || "png";
      
      // Save file - NO processing for now, just save the original
      const uploadDir = join(process.cwd(), "public", "uploads", "entities", id);
      console.log("Creating upload directory:", uploadDir);
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${type}.${ext}`;
      const filePath = join(uploadDir, fileName);
      console.log("Writing file to:", filePath);
      
      await writeFile(filePath, buffer);
      console.log("File written successfully to:", filePath);

      // Update entity record - use the actual filename with extension
      const publicPath = `/uploads/entities/${id}/${fileName}?t=${Date.now()}`; // Add timestamp to bust cache
      console.log("Public path:", publicPath);
      
      const currentImages = (entity.images as Record<string, string>) || {};
      const updatedImages = {
        ...currentImages,
        [type]: publicPath,
      };

      await prisma.entity.update({
        where: { id },
        data: {
          images: updatedImages,
        },
      });

      return createSuccessResponse({ path: publicPath }, "Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      return createErrorResponse("Failed to upload image", 500);
    }
  });
}


