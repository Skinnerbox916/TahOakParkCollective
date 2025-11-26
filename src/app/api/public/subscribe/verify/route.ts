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

    if (magicLink.used) {
      return createErrorResponse("Token already used", 400);
    }

    if (magicLink.purpose !== MagicLinkPurpose.VERIFY_SUBSCRIPTION) {
      return createErrorResponse("Invalid token purpose", 400);
    }

    // Update Subscriber
    await prisma.subscriber.update({
      where: { email: magicLink.email },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Mark token as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true, usedAt: new Date() },
    });

    // Return success (or redirect to success page)
    // Ideally redirect, but for API we return JSON. The page handling this route should probably call this API.
    // Wait, this is an API route. The Frontend page `/subscribe/verify?token=...` will call this?
    // Or is this the route the user clicks?
    // Usually the link points to a frontend page which then calls the API.
    // My email logic pointed to `${process.env.NEXTAUTH_URL}/subscribe/verify?token=${token}`.
    // If `/subscribe/verify` is a page, it should call this API.
    
    return createSuccessResponse(null, "Subscription verified successfully");
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return createErrorResponse("Failed to verify subscription", 500);
  }
}


