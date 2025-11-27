import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { isValidLocale } from "./translations";

/**
 * Extracts locale from NextRequest
 * 
 * Priority:
 * 1. URL path segment (/en/api/... or /es/api/...)
 * 2. Query parameter (?locale=es)
 * 3. Default locale (en)
 * 
 * @param request - NextRequest object
 * @returns Locale string (e.g., "en", "es")
 */
export function getLocaleFromRequest(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  
  // Check URL path for locale prefix (e.g., /en/api/categories or /es/api/categories)
  // API routes might be at /api/... but locale could be in referer or path
  const pathSegments = pathname.split("/").filter(Boolean);
  
  // Check if first segment is a valid locale
  if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
    return pathSegments[0];
  }

  // Check query parameter
  const localeParam = request.nextUrl.searchParams.get("locale");
  if (isValidLocale(localeParam)) {
    return localeParam;
  }

  // Check referer header for locale (client-side requests may include locale in referer)
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererPath = refererUrl.pathname.split("/").filter(Boolean);
      if (refererPath.length > 0 && isValidLocale(refererPath[0])) {
        return refererPath[0];
      }
    } catch (e) {
      // Invalid referer URL, ignore
    }
  }

  // Default fallback
  return routing.defaultLocale;
}

