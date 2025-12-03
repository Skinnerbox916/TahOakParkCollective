import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ENTITY_STATUS, ApprovalStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      // Count entities by status
      const [activeEntities, inactiveEntities, totalEntities] = await Promise.all([
        prisma.entity.count({ where: { status: ENTITY_STATUS.ACTIVE } }),
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

      // Count pending approvals
      const pendingApprovals = await prisma.approval.count({
        where: { status: ApprovalStatus.PENDING },
      });

      // Count pending issue reports
      const pendingIssueReports = await prisma.issueReport.count({
        where: { status: "PENDING" },
      });

      return createSuccessResponse({
        entities: {
          total: totalEntities,
          active: activeEntities,
          inactive: inactiveEntities,
        },
        users: {
          total: totalUsers,
          user: userCount,
          entityOwner: entityOwnerCount,
          admin: adminCount,
        },
        pendingApprovals,
        pendingIssueReports,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return createErrorResponse("Failed to fetch statistics", 500);
    }
  });
}
