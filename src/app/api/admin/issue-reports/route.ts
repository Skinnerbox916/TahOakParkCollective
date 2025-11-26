import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ReportStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as ReportStatus | null;

      const where: any = {};
      if (status && Object.values(ReportStatus).includes(status)) {
        where.status = status;
      } else {
        where.status = ReportStatus.PENDING;
      }

      const reports = await prisma.issueReport.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });

      // Fetch entity information for each report
      const reportsWithEntities = await Promise.all(
        reports.map(async (report) => {
          const entity = await prisma.entity.findUnique({
            where: { id: report.entityId },
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
            },
          });
          return {
            ...report,
            entity: entity || null,
          };
        })
      );
      
      return createSuccessResponse(reportsWithEntities);
    } catch (error) {
      console.error("Error fetching issue reports:", error);
      return createErrorResponse("Failed to fetch issue reports", 500);
    }
  });
}


