import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludeStandard, transformEntity } from "@/lib/entity-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const { slug } = await params;
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: ENTITY_STATUS.ACTIVE, // Only return active entities for public API
      },
      include: entityIncludeStandard,
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Map entity to include localized display fields while preserving canonical values
    const transformed = transformEntity(entity, locale);
    return createSuccessResponse(transformed);
  } catch (error) {
    console.error("Error fetching entity by slug:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

