import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

interface EntityStats {
  pageviews: number;
  visitors: number;
}

/**
 * Fetch analytics stats for a specific entity
 * Currently returns zeros — analytics integration removed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    const { id } = await params;

    const entity = await prisma.entity.findUnique({
      where: { id },
      select: { id: true, slug: true, ownerId: true },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
      return createErrorResponse("Forbidden", 403);
    }

    return createSuccessResponse<EntityStats>({ pageviews: 0, visitors: 0 });
  });
}
