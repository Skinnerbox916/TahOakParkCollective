import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE, ENTITY_STATUS } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getCurrentUser } from "@/lib/auth";
import { entityIncludePublic, entityIncludeWithMembers, transformEntity } from "@/lib/entity-helpers";
import { deleteEntity, proposeUpdate, unpublishListing } from "@/lib/entities";
import { notifyAdmins, notifyPublishChange } from "@/lib/email";
import { deleteUpload, keyFromPublicUrl } from "@/lib/storage";

/**
 * Admins and the listing's members get the full record (any status, with members).
 * Everyone else, including anonymous visitors on the report page, gets the
 * public view of ACTIVE entities only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const { id } = await params;
    const user = await getCurrentUser();

    const entity = await prisma.entity.findUnique({
      where: { id },
      include: entityIncludeWithMembers,
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    const isAdmin = user?.roles?.includes(ROLE.ADMIN) ?? false;
    const isMember = !!user?.id && entity.members.some((m) => m.user.id === user.id);

    if (isAdmin || isMember) {
      return createSuccessResponse(transformEntity(entity, locale, isAdmin));
    }

    if (entity.status !== ENTITY_STATUS.ACTIVE) {
      return createErrorResponse("Entity not found", 404);
    }

    const publicEntity = await prisma.entity.findUnique({
      where: { id },
      include: entityIncludePublic,
    });
    if (!publicEntity) {
      return createErrorResponse("Entity not found", 404);
    }
    return createSuccessResponse(transformEntity(publicEntity, locale));
  } catch (error) {
    console.error("Error fetching entity:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

/**
 * Save an edit form. Admin edits apply immediately; an owner's edits become a
 * pending approval. Send `version` (from GET) so edits made in the meantime
 * aren't silently overwritten: a mismatch returns 409 with code stale_version.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const { version, ...fields } = await request.json();
      const isAdmin = user.roles.includes(ROLE.ADMIN);

      const result = await proposeUpdate(user, id, fields, {
        source: isAdmin ? "admin" : "owner",
        expectedVersion: typeof version === "number" ? version : undefined,
      });

      if (result.pending) {
        const entity = await prisma.entity.findUnique({ where: { id }, select: { name: true } });
        await notifyAdmins(
          `Owner edit to review: ${entity?.name ?? id}`,
          [`${user.email ?? "An owner"} changed: ${Object.keys(result.changes).join(", ")}.`],
          `/admin/approvals/${result.approval.id}`
        );
        return createSuccessResponse(
          { approval: { id: result.approval.id }, pendingReview: true },
          "Changes submitted for review"
        );
      }

      const entity = await prisma.entity.findUnique({ where: { id }, include: entityIncludeWithMembers });
      return createSuccessResponse(
        transformEntity(entity, getLocaleFromRequest(request), true),
        "Entity updated successfully"
      );
    } catch (error) {
      return entityErrorResponse(error, "Failed to update entity");
    }
  });
}

/**
 * Admins delete the listing (approval history is kept). For its owner,
 * "delete" unpublishes it right away and withdraws their consent.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;

      if (user.roles.includes(ROLE.ADMIN)) {
        const { images } = await deleteEntity(user, id);
        for (const url of Object.values(images)) {
          const key = typeof url === "string" ? keyFromPublicUrl(url) : null;
          if (key) await deleteUpload(key).catch((e) => console.warn("Could not delete upload:", key, e));
        }
        return createSuccessResponse(null, "Entity deleted successfully");
      }

      await unpublishListing(user, id);
      await notifyPublishChange(id, false, user.email);
      return createSuccessResponse({ published: false }, "Listing unpublished");
    } catch (error) {
      return entityErrorResponse(error, "Failed to delete entity");
    }
  });
}
