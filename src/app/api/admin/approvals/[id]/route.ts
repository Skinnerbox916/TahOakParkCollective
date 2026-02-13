import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ApprovalStatus, ApprovalType, ENTITY_STATUS } from "@/lib/prismaEnums";
import { normalizeSnapshot } from "@/lib/entitySnapshot";
import { applyEntitySnapshot } from "@/lib/applyEntitySnapshot";

// GET - Fetch single approval details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      
      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          targetEntity: {
            include: {
              categories: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              tags: { include: { tag: true } },
            },
          },
          entity: true,
        },
      });

      if (!approval) {
        return createErrorResponse("Approval not found", 404);
      }

      const snapshot = approval.proposedEntityData as Record<string, unknown>;

      const categorySlugs = (snapshot.categorySlugs as string[]) || [];
      const resolvedCategories =
        categorySlugs.length > 0
          ? await prisma.category.findMany({
              where: { slug: { in: categorySlugs } },
              select: { id: true, name: true, slug: true },
            })
          : [];

      const tagSlugs = (snapshot.tagSlugs as string[]) || [];
      const resolvedTags =
        tagSlugs.length > 0
          ? await prisma.tag.findMany({
              where: { slug: { in: tagSlugs } },
              select: { id: true, name: true, slug: true, category: true },
            })
          : [];

      return createSuccessResponse({
        ...approval,
        resolvedCategories,
        resolvedTags,
      });
    } catch (error) {
      console.error("Error fetching approval:", error);
      return createErrorResponse("Failed to fetch approval", 500);
    }
  });
}

// PUT - Approve or reject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { action, notes } = body; // action: 'APPROVE' | 'REJECT'

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        return createErrorResponse("Valid action (APPROVE or REJECT) is required", 400);
      }

      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          targetEntity: true,
        },
      });

      if (!approval) {
        return createErrorResponse("Approval not found", 404);
      }

      if (approval.status !== ApprovalStatus.PENDING) {
        return createErrorResponse("Approval is already processed", 400);
      }

      if (action === "REJECT") {
        const updated = await prisma.approval.update({
          where: { id },
          data: {
            status: ApprovalStatus.REJECTED,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes: notes || null,
          },
        });
        return createSuccessResponse(updated, "Approval rejected");
      }

      // APPROVE Logic
      if (action === "APPROVE") {
        switch (approval.type) {
          case ApprovalType.NEW_ENTITY: {
            const adminUser = await prisma.user.findFirst({
              where: { roles: { has: ROLE.ADMIN } },
            });
            if (!adminUser) {
              return createErrorResponse("No admin user found to assign as owner", 500);
            }

            const entity = await applyEntitySnapshot(approval.proposedEntityData as any, {
              targetEntityId: null,
              defaultOwnerId: adminUser.id,
              statusForNew: ENTITY_STATUS.ACTIVE,
            });

            const updated = await prisma.approval.update({
              where: { id },
              data: {
                status: ApprovalStatus.APPROVED,
                reviewedBy: user.id,
                reviewedAt: new Date(),
                notes: notes || null,
                entityId: entity.id,
              },
            });

            return createSuccessResponse({ approval: updated, entity }, "Entity created and approved");
          }

          case ApprovalType.UPDATE_ENTITY: {
            if (!approval.targetEntityId) {
              return createErrorResponse("No target entity associated with this approval", 400);
            }
            const entity = await applyEntitySnapshot(approval.proposedEntityData as any, {
              targetEntityId: approval.targetEntityId,
              defaultOwnerId: approval.targetEntity?.ownerId || user.id,
            });
            const updated = await prisma.approval.update({
              where: { id },
              data: {
                status: ApprovalStatus.APPROVED,
                reviewedBy: user.id,
                reviewedAt: new Date(),
                notes: notes || null,
                entityId: approval.targetEntityId,
              },
            });
            return createSuccessResponse({ approval: updated, entity }, "Entity updated and approved");
          }

          default:
            return createErrorResponse("Unsupported approval type for new model", 400);
        }
      }

      return createErrorResponse("Unknown error", 500);
    } catch (error) {
      console.error("Error processing approval:", error);
      return createErrorResponse("Failed to process approval", 500);
    }
  });
}

// PATCH - Update proposedEntityData for pending approvals
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { proposedEntityData } = body;

      if (!proposedEntityData || typeof proposedEntityData !== "object") {
        return createErrorResponse("proposedEntityData is required and must be an object", 400);
      }

      // Find the approval with entity info
      const approval = await prisma.approval.findUnique({
        where: { id },
      });

      if (!approval) {
        return createErrorResponse("Approval not found", 404);
      }

      // Only allow editing PENDING approvals
      if (approval.status !== ApprovalStatus.PENDING) {
        return createErrorResponse("Only PENDING approvals can be edited", 400);
      }

      // Allow editing snapshots for both NEW_ENTITY and UPDATE_ENTITY

      // Validate required fields
      if (!proposedEntityData.name || typeof proposedEntityData.name !== "string" || !proposedEntityData.name.trim()) {
        return createErrorResponse("Entity name is required", 400);
      }

      if (!proposedEntityData.slug || typeof proposedEntityData.slug !== "string" || !proposedEntityData.slug.trim()) {
        return createErrorResponse("Entity slug is required", 400);
      }

      // Validate and normalize input
      let normalized;
      try {
        normalized = normalizeSnapshot(proposedEntityData as any);
      } catch (validationError) {
        // Return validation error with field information
        const { ValidationError } = await import("@/lib/normalizeEntityInput");
        if (validationError instanceof ValidationError) {
          return createErrorResponse(validationError.message, 400, validationError.fieldErrors);
        }
        const message = validationError instanceof Error ? validationError.message : "Invalid input";
        return createErrorResponse(message, 400);
      }

      const resolvedCategories = normalized.categorySlugs.length
        ? await prisma.category.findMany({
            where: { slug: { in: normalized.categorySlugs } },
            select: { id: true, name: true, slug: true },
          })
        : [];

      const resolvedTags =
        normalized.tagSlugs && normalized.tagSlugs.length
          ? await prisma.tag.findMany({
              where: { slug: { in: normalized.tagSlugs } },
              select: { id: true, name: true, slug: true, category: true },
            })
          : [];

      const updated = await prisma.approval.update({
        where: { id },
        data: {
          proposedEntityData: normalized as any,
        },
      });

      return createSuccessResponse(
        {
          ...updated,
          resolvedCategories,
          resolvedTags,
        },
        "Approval snapshot updated successfully"
      );
    } catch (error) {
      console.error("Error updating approval entityData:", error);
      return createErrorResponse("Failed to update approval", 500);
    }
  });
}



