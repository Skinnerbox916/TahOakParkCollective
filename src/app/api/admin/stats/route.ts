import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ENTITY_STATUS } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      // Count entities by status
      const [activeEntities, pendingEntities, inactiveEntities, totalEntities] = await Promise.all([
        prisma.entity.count({ where: { status: ENTITY_STATUS.ACTIVE } }),
        prisma.entity.count({ where: { status: ENTITY_STATUS.PENDING } }),
        prisma.entity.count({ where: { status: ENTITY_STATUS.INACTIVE } }),
        prisma.entity.count(),
      ]);

      // Count users by role (users can have multiple roles)
      const [userCount, entityOwnerCount, adminCount, totalUsers] = await Promise.all([
        prisma.user.count({ where: { roles: { has: ROLE.USER } } }),
        prisma.user.count({ where: { roles: { has: ROLE.ENTITY_OWNER } } }),
        prisma.user.count({ where: { roles: { has: ROLE.ADMIN } } }),
        prisma.user.count(),
      ]);

      return createSuccessResponse({
        entities: {
          total: totalEntities,
          active: activeEntities,
          pending: pendingEntities,
          inactive: inactiveEntities,
        },
        users: {
          total: totalUsers,
          user: userCount,
          entityOwner: entityOwnerCount,
          admin: adminCount,
        },
        pendingApprovals: pendingEntities,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return createErrorResponse("Failed to fetch statistics", 500);
    }
  });
}

