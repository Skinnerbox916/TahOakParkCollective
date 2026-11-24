import { NextRequest } from "next/server";
import { createSuccessResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { proposeUpdate } from "@/lib/entities";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const spotCheckDate = new Date().toISOString();
      await proposeUpdate(user, id, { spotCheckDate }, { source: "admin" });
      return createSuccessResponse({ id, spotCheckDate }, "Entity marked as spot checked");
    } catch (error) {
      return entityErrorResponse(error, "Failed to mark spot check");
    }
  });
}
