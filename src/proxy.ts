import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

// Create next-intl middleware for locale handling
const intlMiddleware = createMiddleware(routing);

// Main proxy function
export function proxy(request: NextRequest) {
  // Handle locale routing with next-intl
  const response = intlMiddleware(request);

  // Add cache control headers for HTML pages to prevent stale content
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';
  
  if (pathWithoutLocale === '/' || pathWithoutLocale.startsWith('/auth')) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};

