import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

/**
 * Check Umami service status
 * This endpoint checks if Umami is accessible and returns setup information
 */
export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      // Public URL (what we show in the UI / browser) - use LAN IP for accessibility
      const publicUrl =
        process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL ||
        process.env.NEXT_PUBLIC_UMAMI_URL ||
        "http://192.168.1.219:3010";

      // Internal URL (how this API route talks to the Umami container)
      const internalUrl =
        process.env.UMAMI_INTERNAL_URL || "http://umami:3000";
      const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      // Try to ping Umami to see if it's running
      let umamiStatus = "unknown";
      let umamiAccessible = false;

      try {
        const response = await fetch(`${internalUrl}/api/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        umamiAccessible = response.ok;
        umamiStatus = response.ok ? "running" : "unreachable";
      } catch (error) {
        umamiStatus = "unreachable";
        umamiAccessible = false;
      }

      return createSuccessResponse({
        configured: !!websiteId,
        umamiUrl: publicUrl,
        websiteId: websiteId || null,
        umamiStatus,
        umamiAccessible,
        setupSteps: !websiteId ? [
          "Start Umami: docker compose up -d umami umami-db",
          `Access dashboard: ${publicUrl}`,
          "Log in (admin / umami) and create a website",
          "Copy Website ID and add to .env",
          "Restart web container: docker compose restart tahoak-web",
        ] : [],
      });
    } catch (error) {
      console.error("Error checking Umami status:", error);
      return createErrorResponse("Failed to check Umami status", 500);
    }
  });
}

