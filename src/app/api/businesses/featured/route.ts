import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  try {
    // Fetch all featured active businesses
    const featuredBusinesses = await prisma.business.findMany({
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
    // For now, return all featured businesses - rotation can be handled client-side
    return createSuccessResponse(featuredBusinesses);
  } catch (error) {
    console.error("Error fetching featured businesses:", error);
    return createErrorResponse("Failed to fetch featured businesses", 500);
  }
}



