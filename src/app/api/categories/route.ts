import { NextRequest } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { fetchAndTransformCategories } from "@/lib/category-helpers";
import type { EntityType } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const entityType = request.nextUrl.searchParams.get("entityType") as EntityType | null;
    
    const categories = await fetchAndTransformCategories(locale, {
      entityType,
      requireEntityTypes: true,
    });

    return createSuccessResponse(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return createErrorResponse(
      `Failed to fetch categories: ${error?.message || "Unknown error"}`,
      500
    );
  }
}





