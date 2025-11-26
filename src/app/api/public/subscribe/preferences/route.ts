import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return createErrorResponse("Token is required", 400);
    }

    // Find valid token
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return createErrorResponse("Invalid token", 400);
    }

    if (magicLink.expiresAt < new Date()) {
      return createErrorResponse("Token expired", 400);
    }

    if (magicLink.purpose !== MagicLinkPurpose.MANAGE_PREFERENCES) {
      return createErrorResponse("Invalid token purpose", 400);
    }

    // Get subscriber preferences
    const subscriber = await prisma.subscriber.findUnique({
      where: { email: magicLink.email },
    });

    if (!subscriber) {
      return createErrorResponse("Subscriber not found", 404);
    }

    return createSuccessResponse(
      {
        email: subscriber.email,
        preferences: subscriber.preferences || {},
        verified: subscriber.verified,
        unsubscribed: subscriber.unsubscribed,
      },
      "Preferences retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting preferences:", error);
    return createErrorResponse("Failed to get preferences", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return createErrorResponse("Token is required", 400);
    }

    const body = await request.json();
    const { preferences } = body;

    // Find valid token
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return createErrorResponse("Invalid token", 400);
    }

    if (magicLink.expiresAt < new Date()) {
      return createErrorResponse("Token expired", 400);
    }

    if (magicLink.purpose !== MagicLinkPurpose.MANAGE_PREFERENCES) {
      return createErrorResponse("Invalid token purpose", 400);
    }

    // Update subscriber preferences
    const subscriber = await prisma.subscriber.update({
      where: { email: magicLink.email },
      data: {
        preferences: preferences || {},
      },
    });

    return createSuccessResponse(
      {
        email: subscriber.email,
        preferences: subscriber.preferences,
      },
      "Preferences updated successfully"
    );
  } catch (error) {
    console.error("Error updating preferences:", error);
    return createErrorResponse("Failed to update preferences", 500);
  }
}

