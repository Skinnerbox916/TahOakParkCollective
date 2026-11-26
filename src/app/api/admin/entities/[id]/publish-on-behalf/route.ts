import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { publishOnBehalf } from "@/lib/entities";

/**
 * An admin publishes a listing for an owner who agreed offline, recording who
 * agreed and how: { givenBy, method, note?, agreedTermsVersion }.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      await publishOnBehalf(user, id, {
        givenBy: body?.givenBy,
        method: body?.method,
        note: body?.note,
        agreedTermsVersion: body?.agreedTermsVersion,
      });
      return createSuccessResponse({ published: true }, "Listing published for its owner");
    } catch (error) {
      return entityErrorResponse(error, "Failed to publish listing");
    }
  });
}
