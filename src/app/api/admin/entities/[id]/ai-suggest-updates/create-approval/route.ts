import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { proposeUpdate } from "@/lib/entities";

const ALLOWED_FIELDS = new Set([
  "name",
  "description",
  "address",
  "phone",
  "website",
  "entityType",
  "categorySlugs",
  "tagSlugs",
  "hours",
  "socialMedia",
  "nameTranslations",
  "descriptionTranslations",
  "seoTitleTranslations",
  "seoDescriptionTranslations",
]);

/** Turn the AI suggestions an admin accepted into a pending update for review. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { acceptedSuggestions } = body || {};

      if (!Array.isArray(acceptedSuggestions) || acceptedSuggestions.length === 0) {
        return createErrorResponse("acceptedSuggestions must be a non-empty array", 400);
      }

      const fields: Record<string, unknown> = {};
      for (const suggestion of acceptedSuggestions) {
        if (!suggestion || typeof suggestion.field !== "string") continue;
        if (!ALLOWED_FIELDS.has(suggestion.field)) continue;
        fields[suggestion.field] = suggestion.suggestedValue;
      }

      const { approval } = await proposeUpdate(user, id, fields, { source: "ai_suggest", autoApprove: false });
      return createSuccessResponse({ approvalId: approval.id }, "Approval created");
    } catch (error) {
      return entityErrorResponse(error, "Failed to create approval");
    }
  });
}
