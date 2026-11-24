import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { proposeClaim } from "@/lib/entities";
import { sendClaimNotificationEmail } from "@/lib/email";

/**
 * A signed-in user claims a listing. It becomes a CLAIM_ENTITY approval; an
 * admin confirms the claimant really runs the business, then approves.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const { approval, entity } = await proposeClaim(user, id, body?.message);

      const admins = await prisma.user.findMany({
        where: { roles: { has: ROLE.ADMIN }, email: { not: null } },
        select: { email: true },
      });
      await Promise.all(
        admins.map((admin) => sendClaimNotificationEmail(admin.email!, entity.name, user.email ?? "unknown"))
      );

      return createSuccessResponse({ approval: { id: approval.id }, pendingReview: true }, "Claim submitted");
    } catch (error) {
      return entityErrorResponse(error, "Failed to submit claim");
    }
  });
}
