import { NextRequest } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { fetchAndTransformCategories } from "@/lib/category-helpers";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const categories = await fetchAndTransformCategories(locale, {
      featured: true,
    });

    return createSuccessResponse(categories);
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return createErrorResponse("Failed to fetch featured categories", 500);
  }
}



