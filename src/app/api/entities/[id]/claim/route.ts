import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { proposeClaim } from "@/lib/entities";
import { sendClaimNotification } from "@/lib/email";
import { HOUR, limitRequest } from "@/lib/rate-limit";

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
      const limited = limitRequest(request, "claim", [[`user:${user.id}`, 5, 24 * HOUR]]);
      if (limited) return limited;
      const body = await request.json().catch(() => ({}));
      const { approval, entity } = await proposeClaim(user, id, body?.message);

      const admins = await prisma.user.findMany({
        where: { role: { contains: "admin" } },
        select: { email: true },
      });
      await Promise.all(
        admins.map((admin) => sendClaimNotification(admin.email, entity.name, user.email ?? "unknown"))
      );

      return createSuccessResponse({ approval: { id: approval.id }, pendingReview: true }, "Claim submitted");
    } catch (error) {
      return entityErrorResponse(error, "Failed to submit claim");
    }
  });
}
