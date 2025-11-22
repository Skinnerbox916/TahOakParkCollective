import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - require ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== ROLE.ADMIN) {
        return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
      }
    }

    // Portal routes - require BUSINESS_OWNER or ADMIN role
    if (path.startsWith("/portal")) {
      if (
        token?.role !== ROLE.BUSINESS_OWNER &&
        token?.role !== ROLE.ADMIN
      ) {
        return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
      }
    }

    const response = NextResponse.next();
    // Add cache control headers for HTML pages to prevent stale content
    if (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/auth")) {
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes don't require auth
        if (
          path === "/" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/auth") ||
          path.startsWith("/businesses")
        ) {
          return true;
        }

        // Admin and portal routes require auth
        if (path.startsWith("/admin") || path.startsWith("/portal")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/",
    "/auth/:path*",
  ],
};

