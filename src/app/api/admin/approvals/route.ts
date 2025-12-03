import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ApprovalStatus, ApprovalType } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as ApprovalStatus | null;
      const type = searchParams.get("type") as ApprovalType | null;

      const where: Record<string, unknown> = {};

      if (status && Object.values(ApprovalStatus).includes(status)) {
        where.status = status;
      } else {
        // Default to PENDING if not specified
        where.status = ApprovalStatus.PENDING;
      }

      if (type && Object.values(ApprovalType).includes(type)) {
        where.type = type;
      }

      const approvals = await prisma.approval.findMany({
        where,
        include: {
          entity: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return createSuccessResponse(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      return createErrorResponse("Failed to fetch approvals", 500);
    }
  });
}





