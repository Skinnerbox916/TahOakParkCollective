import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { acceptShareLink } from "@/lib/entities";
import { notifyPublishChange } from "@/lib/email";
import { HOUR, limitRequest } from "@/lib/rate-limit";

/**
 * The signed-in user takes over the listing a share link points to, and with
 * { publish: true, agreedTermsVersion } publishes it in the same step.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  return withAuth(async (user) => {
    try {
      const limited = limitRequest(request, "share-accept", [
        [`user:${user.id}`, 10, HOUR],
        ["ip", 20, HOUR],
      ]);
      if (limited) return limited;
      const { token } = await params;
      const body = await request.json().catch(() => ({}));
      const result = await acceptShareLink(user, token, {
        publish: body?.publish === true,
        agreedTermsVersion: body?.agreedTermsVersion,
      });
      await notifyPublishChange(result.entityId, result.published, user.email, { tookOver: true });
      return createSuccessResponse(result, result.published ? "Listing published" : "You now manage this listing");
    } catch (error) {
      return entityErrorResponse(error, "Failed to accept the link");
    }
  });
}
