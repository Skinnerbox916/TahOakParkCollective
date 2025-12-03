import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, address, website, submitterEmail, submitterName } = body;

    if (!name || !submitterEmail) {
      return createErrorResponse("Name and email are required", 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Create approval with NEW_ENTITY type
    const approval = await prisma.approval.create({
      data: {
        type: ApprovalType.NEW_ENTITY,
        status: ApprovalStatus.PENDING,
        entityData: {
          name,
          description: description || null,
          address: address || null,
          website: website || null,
          submitterName: submitterName || null,
        },
        submitterEmail,
        source: "public",
      },
    });

    return createSuccessResponse(approval, "Suggestion submitted successfully");
  } catch (error) {
    console.error("Error submitting entity suggestion:", error);
    return createErrorResponse("Failed to submit suggestion", 500);
  }
}
