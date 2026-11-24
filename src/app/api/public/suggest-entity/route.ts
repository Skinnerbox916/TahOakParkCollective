import { NextRequest } from "next/server";
import { createSuccessResponse, createErrorResponse, entityErrorResponse } from "@/lib/api-helpers";
import { proposeNewEntity } from "@/lib/entities";

/** Anyone can suggest a listing; it waits for an admin, who adds categories before approving. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, address, website, submitterEmail } = body;

    if (!name || !submitterEmail) {
      return createErrorResponse("Name and email are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return createErrorResponse("Invalid email format", 400);
    }

    const { approval } = await proposeNewEntity(
      { id: null, roles: [], email: String(submitterEmail).trim().toLowerCase() },
      { name, description: description || null, address: address || null, website: website || null },
      { source: "public", geocode: false }
    );

    return createSuccessResponse({ approval: { id: approval.id } }, "Suggestion submitted successfully");
  } catch (error) {
    return entityErrorResponse(error, "Failed to submit suggestion");
  }
}
