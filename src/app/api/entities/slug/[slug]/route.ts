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
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only return active entities for public API
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

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    return createSuccessResponse(entity);
  } catch (error) {
    console.error("Error fetching entity by slug:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

