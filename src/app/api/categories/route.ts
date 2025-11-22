import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return createSuccessResponse(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return createErrorResponse("Failed to fetch categories", 500);
  }
}


