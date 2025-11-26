import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ChangeStatus, ChangeType } from "@/lib/prismaEnums";

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

      const change = await prisma.pendingChange.findUnique({
        where: { id },
        include: {
          entity: true,
        }
      });

      if (!change) {
        return createErrorResponse("Pending change not found", 404);
      }

      if (change.status !== ChangeStatus.PENDING) {
        return createErrorResponse("Change is already processed", 400);
      }

      if (action === "REJECT") {
        // Just mark as rejected
        const updated = await prisma.pendingChange.update({
          where: { id },
          data: {
            status: ChangeStatus.REJECTED,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes: notes || null,
          },
        });
        return createSuccessResponse(updated, "Change rejected");
      }

      // APPROVE Logic
      // Apply changes based on type
      if (action === "APPROVE") {
        const newValue = change.newValue as any;

        switch (change.changeType) {
          case ChangeType.UPDATE_ENTITY:
            // Update entity fields
            await prisma.entity.update({
              where: { id: change.entityId },
              data: newValue,
            });
            break;

          case ChangeType.ADD_TAG:
            // Add tag (and verify it if friendliness)
            // newValue should contain tagId
            if (newValue.tagId) {
               // Check if tag exists
               const tag = await prisma.tag.findUnique({ where: { id: newValue.tagId } });
               if (tag) {
                 // Upsert EntityTag
                 await prisma.entityTag.upsert({
                   where: {
                     entityId_tagId: {
                       entityId: change.entityId,
                       tagId: newValue.tagId,
                     },
                   },
                   update: {
                     verified: true, // Admin approved, so it is verified
                   },
                   create: {
                     entityId: change.entityId,
                     tagId: newValue.tagId,
                     verified: true,
                     createdBy: change.submittedBy,
                   },
                 });
               }
            }
            break;

          case ChangeType.REMOVE_TAG:
             if (newValue.tagId) {
               await prisma.entityTag.deleteMany({
                 where: {
                   entityId: change.entityId,
                   tagId: newValue.tagId,
                 },
               });
             }
            break;
            
          case ChangeType.UPDATE_IMAGE:
             // Update images field
             await prisma.entity.update({
               where: { id: change.entityId },
               data: {
                 images: newValue,
               },
             });
            break;
        }

        // Mark change as APPROVED
        const updated = await prisma.pendingChange.update({
          where: { id },
          data: {
            status: ChangeStatus.APPROVED,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes: notes || null,
          },
        });

        return createSuccessResponse(updated, "Change approved and applied");
      }
    } catch (error) {
      console.error("Error processing pending change:", error);
      return createErrorResponse("Failed to process change", 500);
    }
  });
}


