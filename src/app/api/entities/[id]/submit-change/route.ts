import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { approvalType, fieldName, oldValue, newValue } = body;

      if (!approvalType || !newValue) {
        return createErrorResponse("approvalType and newValue are required", 400);
      }

      if (!Object.values(ApprovalType).includes(approvalType)) {
        return createErrorResponse("Invalid approvalType", 400);
      }

      // Verify entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Create approval
      const approval = await prisma.approval.create({
        data: {
          entityId: id,
          type: approvalType as ApprovalType,
          fieldName,
          oldValue: oldValue || null,
          newValue,
          submittedBy: user.id,
          submitterEmail: user.email,
          status: ApprovalStatus.PENDING,
          source: "owner",
        },
      });

      return createSuccessResponse(approval, "Change submitted for review");
    } catch (error) {
      console.error("Error submitting change:", error);
      return createErrorResponse("Failed to submit change", 500);
    }
  });
}
