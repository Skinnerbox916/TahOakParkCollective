import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tags = await prisma.entityTag.findMany({
      where: { entityId: id },
      include: {
        tag: true,
      },
    });

    return createSuccessResponse(tags);
  } catch (error) {
    console.error("Error fetching entity tags:", error);
    return createErrorResponse("Failed to fetch entity tags", 500);
  }
}

// Tags are edited as part of the listing (tagSlugs), through src/lib/entities.
