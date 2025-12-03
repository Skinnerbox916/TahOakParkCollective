import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludeStandard, transformEntity } from "@/lib/entity-helpers";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    
    // Fetch all featured active entities
    const featuredEntities = await prisma.entity.findMany({
      where: {
        featured: true,
        status: ENTITY_STATUS.ACTIVE,
      },
      include: entityIncludeStandard,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map entities to include translated content
    const translatedEntities = featuredEntities.map((entity) => transformEntity(entity, locale));

    // Return random selection (or all if less than desired count)
    // For now, return all featured entities - rotation can be handled client-side
    return createSuccessResponse(translatedEntities);
  } catch (error) {
    console.error("Error fetching featured entities:", error);
    return createErrorResponse("Failed to fetch featured entities", 500);
  }
}

