import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { canManage } from "@/lib/entities";
import { ENTITY_STATUS } from "@/lib/prismaEnums";

/** A listing's tags. Drafts are private: only admins and its members see theirs. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entity = await prisma.entity.findUnique({ where: { id }, select: { status: true } });
    if (!entity) return createErrorResponse("Entity not found", 404);
    if (entity.status !== ENTITY_STATUS.ACTIVE) {
      const user = await getCurrentUser();
      if (!user || !(await canManage(user, id))) return createErrorResponse("Entity not found", 404);
    }

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
