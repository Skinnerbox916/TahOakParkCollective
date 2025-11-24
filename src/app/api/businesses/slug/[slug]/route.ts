import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await prisma.business.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only return active businesses for public API
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
    });

    if (!business) {
      return createErrorResponse("Business not found", 404);
    }

    return createSuccessResponse(business);
  } catch (error) {
    console.error("Error fetching business by slug:", error);
    return createErrorResponse("Failed to fetch business", 500);
  }
}

