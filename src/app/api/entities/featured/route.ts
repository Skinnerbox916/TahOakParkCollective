import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  try {
    // Fetch all featured active entities
    const featuredEntities = await prisma.entity.findMany({
      where: {
        featured: true,
        status: BUSINESS_STATUS.ACTIVE,
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

    // Return random selection (or all if less than desired count)
    // For now, return all featured entities - rotation can be handled client-side
    return createSuccessResponse(featuredEntities);
  } catch (error) {
    console.error("Error fetching featured entities:", error);
    return createErrorResponse("Failed to fetch featured entities", 500);
  }
}

