import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE, ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludeStandard, transformEntity } from "@/lib/entity-helpers";
import { normalizeSnapshot } from "@/lib/entitySnapshot";
import { applyEntitySnapshot } from "@/lib/applyEntitySnapshot";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const locale = getLocaleFromRequest(request);
      const { id } = await params;
      const entity = await prisma.entity.findUnique({
        where: { id },
        include: entityIncludeStandard,
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Include admin-only fields for admin users
      const isAdmin = user.roles.includes(ROLE.ADMIN);
      const translatedEntity = transformEntity(entity, locale, isAdmin);

      return createSuccessResponse(translatedEntity);
    } catch (error) {
      console.error("Error fetching entity:", error);
      return createErrorResponse("Failed to fetch entity", 500);
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Check if entity exists
      const existingEntity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!existingEntity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization
      const isAdmin = user.roles.includes(ROLE.ADMIN);
      const isOwner = existingEntity.ownerId === user.id;

      if (!isAdmin && !isOwner) {
        return createErrorResponse("Forbidden: You can only update your own entity", 403);
      }

      // Validate and normalize input
      let snapshot;
      try {
        snapshot = normalizeSnapshot({
          ...body,
          categorySlugs: body.categorySlugs || [],
          tagSlugs: body.tagSlugs || [],
        });
      } catch (validationError) {
        // Return validation error with field information
        const { ValidationError } = await import("@/lib/normalizeEntityInput");
        if (validationError instanceof ValidationError) {
          return createErrorResponse(validationError.message, 400, validationError.fieldErrors);
        }
        const message = validationError instanceof Error ? validationError.message : "Invalid input";
        return createErrorResponse(message, 400);
      }

      if (isAdmin) {
        // Single pipeline: create approval, auto-approve, apply snapshot
        const result = await prisma.$transaction(async (tx) => {
          const approval = await tx.approval.create({
            data: {
              type: ApprovalType.UPDATE_ENTITY,
              status: ApprovalStatus.APPROVED,
              targetEntityId: id,
              proposedEntityData: snapshot as any,
              submittedBy: user.id,
              submitterEmail: user.email,
              source: "admin",
              reviewedBy: user.id,
              reviewedAt: new Date(),
            },
          });

          const entity = await applyEntitySnapshot(snapshot as any, {
            targetEntityId: id,
            defaultOwnerId: existingEntity.ownerId,
          });

          return { approval, entity };
        });

        return createSuccessResponse(result.entity, "Entity updated successfully");
      }

      // Owner path: create pending approval with snapshot
      const approval = await prisma.approval.create({
        data: {
          type: ApprovalType.UPDATE_ENTITY,
          status: ApprovalStatus.PENDING,
          targetEntityId: id,
          proposedEntityData: snapshot as any,
          submittedBy: user.id,
          submitterEmail: user.email,
          source: "owner",
        },
      });

      return createSuccessResponse(approval, "Changes submitted for review");

    } catch (error) {
      console.error("Error updating entity:", error);
      return createErrorResponse("Failed to update entity", 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;

      // Check if entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only delete your own entity", 403);
      }

      await prisma.entity.delete({
        where: { id },
      });

      return createSuccessResponse(null, "Entity deleted successfully");
    } catch (error) {
      console.error("Error deleting entity:", error);
      return createErrorResponse("Failed to delete entity", 500);
    }
  });
}
