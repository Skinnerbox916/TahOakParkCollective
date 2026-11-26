import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ApprovalStatus } from "@/lib/prismaEnums";
import { entityIncludeWithMembers, withoutAdminFields } from "@/lib/entity-helpers";

/** Listings the signed-in user manages, with how many changes await review. */
export async function GET() {
  return withAuth(async (user) => {
    try {
      const entities = await prisma.entity.findMany({
        where: { members: { some: { userId: user.id } } },
        include: {
          ...entityIncludeWithMembers,
          _count: { select: { approvalTargets: { where: { status: ApprovalStatus.PENDING } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      return createSuccessResponse(
        // Members aren't admins: no verification contact or consent record.
        entities.map(({ _count, ...entity }) => ({
          ...withoutAdminFields(entity),
          pendingChanges: _count.approvalTargets,
        }))
      );
    } catch (error) {
      console.error("Error fetching user entities:", error);
      return createErrorResponse("Failed to fetch entities", 500);
    }
  });
}
