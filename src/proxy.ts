import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files
  // - Internal Next.js paths
  matcher: [
    // Match all pathnames except for:
    // - API routes (/api/...)
    // - Static files (/_next/..., /favicon.ico, etc.)
    // - Files with extensions (.js, .css, .png, etc.)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Always run for root
    '/'
  ]
};


