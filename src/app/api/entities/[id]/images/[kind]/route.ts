import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { removeListingImage, uploadListingImage } from "@/lib/entities";
import { notifyAdmins } from "@/lib/email";
import { IMAGE_KINDS, MAX_UPLOAD_BODY_BYTES, type ImageKind } from "@/lib/images";
import { consume, HOUR } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string; kind: string }> };

const isKind = (kind: string): kind is ImageKind => (IMAGE_KINDS as readonly string[]).includes(kind);

async function tellAdmins(entityId: string, kind: ImageKind, email: string | null | undefined, approvalId: string, removed: boolean) {
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { name: true } });
  const what = kind === "logo" ? "logo" : "cover photo";
  await notifyAdmins(
    `Owner edit to review: ${entity?.name ?? entityId}`,
    [`${email ?? "An owner"} ${removed ? "asked to remove the" : "uploaded a new"} ${what}.`],
    `/admin/approvals/${approvalId}`
  );
}

/**
 * Upload the listing's logo or cover photo (multipart, field "file"). The
 * listing's members and admins; an owner's upload waits for review.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  return withAuth(async (user) => {
    try {
      const { id, kind } = await params;
      if (!isKind(kind)) return createErrorResponse("Unknown image", 404);

      const limit = consume(`image-upload:${user.id}`, 20, HOUR);
      if (!limit.ok) return createErrorResponse("Too many uploads. Try again later.", 429, undefined, { code: "rate_limited" });
      // Refuse an oversized body before reading it into memory.
      if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BODY_BYTES) {
        return createErrorResponse("That file is too large", 400, { file: "validation.image.tooLarge" }, { code: "validation" });
      }

      const file = (await request.formData().catch(() => null))?.get("file");
      if (!(file instanceof File)) {
        return createErrorResponse("Choose an image", 400, { file: "validation.image.notAnImage" }, { code: "validation" });
      }

      const result = await uploadListingImage(user, id, kind, Buffer.from(await file.arrayBuffer()));
      if (result.pending) await tellAdmins(id, kind, user.email, result.approvalId, false);
      return createSuccessResponse({ url: result.url, pending: result.pending, version: result.version });
    } catch (error) {
      return entityErrorResponse(error, "Failed to upload image");
    }
  });
}

/** Remove the listing's logo or cover photo. An owner's removal waits for review. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (user) => {
    try {
      const { id, kind } = await params;
      if (!isKind(kind)) return createErrorResponse("Unknown image", 404);
      const result = await removeListingImage(user, id, kind);
      if (result.pending) await tellAdmins(id, kind, user.email, result.approvalId, true);
      return createSuccessResponse({ url: null, pending: result.pending, version: result.version });
    } catch (error) {
      return entityErrorResponse(error, "Failed to remove image");
    }
  });
}
