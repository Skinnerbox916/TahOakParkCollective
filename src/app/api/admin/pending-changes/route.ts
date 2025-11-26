import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ChangeStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as ChangeStatus | null;
      const entityId = searchParams.get("entityId");

      const where: any = {};

      if (status && Object.values(ChangeStatus).includes(status)) {
        where.status = status;
      } else {
        // Default to PENDING if not specified
        where.status = ChangeStatus.PENDING;
      }

      if (entityId) {
        where.entityId = entityId;
      }

      const changes = await prisma.pendingChange.findMany({
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

      return createSuccessResponse(changes);
    } catch (error) {
      console.error("Error fetching pending changes:", error);
      return createErrorResponse("Failed to fetch pending changes", 500);
    }
  });
}


