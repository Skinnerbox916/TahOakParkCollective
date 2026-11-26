import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { unpublishListing } from "@/lib/entities";
import { notifyPublishChange } from "@/lib/email";

/**
 * Take the listing off the site now. An owner doing this withdraws their
 * consent; an admin does too with { withdrawConsent: true } (the owner asked).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      // withdrawConsent only means something for an admin (the owner asked them to).
      await unpublishListing(user, id, { withdrawConsent: body?.withdrawConsent === true });
      if (!user.roles.includes("ADMIN")) await notifyPublishChange(id, false, user.email);
      return createSuccessResponse({ published: false }, "Listing unpublished");
    } catch (error) {
      return entityErrorResponse(error, "Failed to unpublish listing");
    }
  });
}
