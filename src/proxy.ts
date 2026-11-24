import createMiddleware from 'next-intl/middleware';
import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Signed-in areas. Without a session cookie, go straight to sign-in and come
// back afterwards. This is only a fast path: layouts do the real check.
const PROTECTED = /^\/(en|es)(\/(?:admin|portal)(?:\/.*)?)$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(PROTECTED);
  if (match && !getSessionCookie(request)) {
    const [, locale, path] = match;
    const url = new URL(`/${locale}/auth/signin`, request.url);
    url.searchParams.set('callbackUrl', path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals and files with extensions
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};
