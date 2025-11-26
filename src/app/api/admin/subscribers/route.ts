import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const filter = searchParams.get("filter"); // "all", "verified", "unverified", "unsubscribed"
      const search = searchParams.get("search") || "";

      const where: any = {};

      // Apply filters
      if (filter === "verified") {
        where.verified = true;
        where.unsubscribed = false;
      } else if (filter === "unverified") {
        where.verified = false;
      } else if (filter === "unsubscribed") {
        where.unsubscribed = true;
      }
      // "all" or no filter shows everything

      // Search by email
      if (search && search.trim()) {
        where.email = {
          contains: search.trim(),
          mode: "insensitive" as const,
        };
      }

      const subscribers = await prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          verified: true,
          verifiedAt: true,
          preferences: true,
          unsubscribed: true,
          unsubscribedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return createSuccessResponse(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      return createErrorResponse("Failed to fetch subscribers", 500);
    }
  });
}


