import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ReportStatus, IssueType } from "@/lib/prismaEnums";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityId, issueType, description, submitterEmail, submitterName } = body;

    if (!entityId || !issueType || !description || !submitterEmail) {
      return createErrorResponse("Entity ID, issue type, description, and email are required", 400);
    }

    // Validate issue type
    if (!Object.values(IssueType).includes(issueType)) {
      return createErrorResponse("Invalid issue type", 400);
    }

    // Verify entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Create issue report
    const report = await prisma.issueReport.create({
      data: {
        entityId,
        issueType: issueType as IssueType,
        description,
        submitterEmail,
        submitterName,
        status: ReportStatus.PENDING,
      },
    });

    return createSuccessResponse(report, "Issue reported successfully");
  } catch (error) {
    console.error("Error reporting issue:", error);
    return createErrorResponse("Failed to report issue", 500);
  }
}


