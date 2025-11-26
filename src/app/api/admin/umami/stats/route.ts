import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounceRate: number;
  avgVisitTime: number;
}

/**
 * Fetch analytics stats from Umami API
 */
export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const internalUrl = process.env.UMAMI_INTERNAL_URL || "http://umami:3000";
      const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      if (!websiteId) {
        return createErrorResponse("Umami Website ID not configured", 400);
      }

      // Login to get token
      const loginResponse = await fetch(`${internalUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "umami",
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!loginResponse.ok) {
        throw new Error("Failed to authenticate with Umami");
      }

      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (!token) {
        throw new Error("No token received from Umami");
      }

      // Get date range (default to last 30 days)
      // Umami API expects Unix timestamps in MILLISECONDS
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const startAt = startDate.getTime(); // Unix timestamp in ms
      const endAt = endDate.getTime();     // Unix timestamp in ms

      // Fetch stats - Umami v2 API uses startAt and endAt parameters with Unix timestamps
      let statsUrl = `${internalUrl}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`;
      let statsResponse = await fetch(statsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      // If no data yet or API error, return zeros gracefully
      if (!statsResponse.ok) {
        if (statsResponse.status === 400 || statsResponse.status === 500) {
          // Likely no data yet or invalid date range - return zeros
          console.log(`Umami API returned ${statsResponse.status} - returning zeros`);
          const stats: UmamiStats = {
            pageviews: 0,
            visitors: 0,
            visits: 0,
            bounceRate: 0,
            avgVisitTime: 0,
          };
          return createSuccessResponse(stats);
        }
        
        const errorText = await statsResponse.text();
        let errorMessage = `Umami API error: ${statsResponse.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use the text as is
          if (errorText) errorMessage = `${errorMessage}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const statsData = await statsResponse.json();

      // Format the response - handle different response structures
      const stats: UmamiStats = {
        pageviews: statsData.pageviews?.value ?? statsData.pageviews ?? 0,
        visitors: statsData.visitors?.value ?? statsData.visitors ?? 0,
        visits: statsData.visits?.value ?? statsData.visits ?? 0,
        bounceRate: statsData.bounceRate?.value ?? statsData.bounceRate ?? 0,
        avgVisitTime: statsData.averageVisitTime?.value ?? statsData.averageVisitTime ?? statsData.visitDuration ?? 0,
      };

      return createSuccessResponse(stats);
    } catch (error) {
      console.error("Error fetching Umami stats:", error);
      return createErrorResponse(
        error instanceof Error ? error.message : "Failed to fetch analytics stats",
        500
      );
    }
  });
}

