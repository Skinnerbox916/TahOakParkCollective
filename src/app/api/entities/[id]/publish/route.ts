import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { publishListing } from "@/lib/entities";

/** The listing's owner publishes it, agreeing to the listing terms ({ agreedTermsVersion }). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      await publishListing(user, id, { agreedTermsVersion: body?.agreedTermsVersion });
      return createSuccessResponse({ published: true }, "Listing published");
    } catch (error) {
      return entityErrorResponse(error, "Failed to publish listing");
    }
  });
}
