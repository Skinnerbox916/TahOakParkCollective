import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import type { BusinessStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as BusinessStatus | null;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const businesses = await prisma.business.findMany({
        where,
        include: {
          category: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return createSuccessResponse(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      return createErrorResponse("Failed to fetch businesses", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { id, status } = body;

      if (!id || !status) {
        return createErrorResponse("Business ID and status are required", 400);
      }

      const business = await prisma.business.update({
        where: { id },
        data: { status },
        include: {
          category: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return createSuccessResponse(business, "Business status updated");
    } catch (error) {
      console.error("Error updating business status:", error);
      return createErrorResponse("Failed to update business status", 500);
    }
  });
}

