import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ReportStatus } from "@/lib/prismaEnums";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { action, resolution } = body; // action: 'RESOLVE' | 'DISMISS'

      if (!action || !["RESOLVE", "DISMISS"].includes(action)) {
        return createErrorResponse("Valid action (RESOLVE or DISMISS) is required", 400);
      }

      const report = await prisma.issueReport.findUnique({
        where: { id },
      });

      if (!report) {
        return createErrorResponse("Report not found", 404);
      }

      const status = action === "RESOLVE" ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;

      const updatedReport = await prisma.issueReport.update({
        where: { id },
        data: {
          status,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          resolution: resolution || null,
        },
      });

      return createSuccessResponse(updatedReport, "Report reviewed successfully");
    } catch (error) {
      console.error("Error reviewing report:", error);
      return createErrorResponse("Failed to review report", 500);
    }
  });
}


