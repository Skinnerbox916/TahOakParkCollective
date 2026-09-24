import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { entityIncludeStandard } from "@/lib/entity-helpers";

export async function GET(request: NextRequest) {
  // Any authenticated user can view their owned entities (may be empty for new users)
  return withAuth(async (user) => {
    try {
      const entities = await prisma.entity.findMany({
        where: {
          ownerId: user.id,
        },
        include: entityIncludeStandard,
        orderBy: {
          createdAt: "desc",
        },
      });

      return createSuccessResponse(entities);
    } catch (error) {
      console.error("Error fetching user entities:", error);
      return createErrorResponse("Failed to fetch entities", 500);
    }
  });
}
