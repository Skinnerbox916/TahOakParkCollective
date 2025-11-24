import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.BUSINESS_OWNER, ROLE.ADMIN], async (user) => {
    try {
      const businesses = await prisma.business.findMany({
        where: {
          ownerId: user.id,
        },
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
      console.error("Error fetching user businesses:", error);
      return createErrorResponse("Failed to fetch businesses", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.BUSINESS_OWNER, ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Business ID is required", 400);
      }

      // Verify the user owns this business (unless admin)
      const business = await prisma.business.findUnique({
        where: { id },
      });

      if (!business) {
        return createErrorResponse("Business not found", 404);
      }

      if (!user.roles.includes(ROLE.ADMIN) && business.ownerId !== user.id) {
        return createErrorResponse("Forbidden", 403);
      }

      const updated = await prisma.business.update({
        where: { id },
        data: updateData,
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

      return createSuccessResponse(updated, "Business updated successfully");
    } catch (error) {
      console.error("Error updating business:", error);
      return createErrorResponse("Failed to update business", 500);
    }
  });
}

