import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ApprovalType, ApprovalStatus, ROLE } from "@/lib/prismaEnums";
import { generateSlug } from "@/lib/utils";
import { normalizeSnapshot } from "@/lib/entitySnapshot";

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

    // Find an admin user to own the draft
    const adminUser = await prisma.user.findFirst({
      where: { roles: { has: ROLE.ADMIN } },
      select: { id: true },
    });

    if (!adminUser) {
      return createErrorResponse("Admin user not found", 500);
    }

    const snapshot = normalizeSnapshot({
      name,
      slug: generateSlug(name),
      description: description || null,
      address: address || null,
      website: website || null,
      categorySlugs: [],
      tagSlugs: [],
    });

    const approval = await prisma.approval.create({
      data: {
        type: ApprovalType.NEW_ENTITY,
        status: ApprovalStatus.PENDING,
        targetEntityId: null,
        proposedEntityData: snapshot as any,
        submitterEmail,
        submittedBy: adminUser.id,
        source: "public",
      },
    });

    return createSuccessResponse({ approval }, "Suggestion submitted successfully");
  } catch (error) {
    console.error("Error submitting entity suggestion:", error);
    return createErrorResponse("Failed to submit suggestion", 500);
  }
}
