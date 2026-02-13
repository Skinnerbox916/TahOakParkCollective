import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { entityIncludeStandard } from "@/lib/entity-helpers";
import { suggestEntityUpdates } from "@/lib/ai/entity-update-suggestions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;

      const entity = await prisma.entity.findUnique({
        where: { id },
        include: entityIncludeStandard,
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      const suggestions = await suggestEntityUpdates(entity as any);

      return createSuccessResponse({ suggestions }, "Suggestions generated");
    } catch (error: unknown) {
      console.error("Error generating AI update suggestions:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("OPENAI_API_KEY")) {
        return createErrorResponse("OpenAI API key is not configured.", 500);
      }

      return createErrorResponse(errorMessage || "Failed to generate suggestions", 500);
    }
  });
}

