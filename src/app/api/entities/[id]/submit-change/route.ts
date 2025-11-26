import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ChangeType, ChangeStatus } from "@/lib/prismaEnums";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { changeType, fieldName, oldValue, newValue } = body;

      if (!changeType || !newValue) {
        return createErrorResponse("changeType and newValue are required", 400);
      }

      if (!Object.values(ChangeType).includes(changeType)) {
        return createErrorResponse("Invalid changeType", 400);
      }

      // Verify entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Create pending change
      const change = await prisma.pendingChange.create({
        data: {
          entityId: id,
          changeType: changeType as ChangeType,
          fieldName,
          oldValue: oldValue || null,
          newValue,
          submittedBy: user.id,
          submitterEmail: user.email,
          status: ChangeStatus.PENDING,
        },
      });

      return createSuccessResponse(change, "Change submitted for review");
    } catch (error) {
      console.error("Error submitting change:", error);
      return createErrorResponse("Failed to submit change", 500);
    }
  });
}


