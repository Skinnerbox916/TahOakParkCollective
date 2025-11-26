import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, SuggestionStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as SuggestionStatus | null;

      const where: any = {};
      if (status && Object.values(SuggestionStatus).includes(status)) {
        where.status = status;
      } else {
        // Default to PENDING
        where.status = SuggestionStatus.PENDING;
      }

      const suggestions = await prisma.entitySuggestion.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });

      return createSuccessResponse(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return createErrorResponse("Failed to fetch suggestions", 500);
    }
  });
}


