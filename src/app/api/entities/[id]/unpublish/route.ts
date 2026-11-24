import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { unpublishListing } from "@/lib/entities";

/** Take the listing off the site now. An owner doing this withdraws their consent. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      await unpublishListing(user, id);
      return createSuccessResponse({ published: false }, "Listing unpublished");
    } catch (error) {
      return entityErrorResponse(error, "Failed to unpublish listing");
    }
  });
}
