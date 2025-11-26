import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose } from "@/lib/prismaEnums";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferences } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse("Valid email is required", 400);
    }

    // Check if already subscribed
    let subscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (subscriber) {
      if (subscriber.verified) {
        return createErrorResponse("Email is already subscribed", 409);
      }
      // If not verified, resend verification
    } else {
      // Create subscriber
      subscriber = await prisma.subscriber.create({
        data: {
          email,
          preferences: preferences || {},
          verified: false,
        },
      });
    }

    // Generate Magic Link
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.magicLink.create({
      data: {
        email,
        token,
        purpose: MagicLinkPurpose.VERIFY_SUBSCRIPTION,
        expiresAt,
      },
    });

    // Send Email
    const sent = await sendVerificationEmail(email, token);

    if (!sent) {
      return createErrorResponse("Failed to send verification email", 500);
    }

    return createSuccessResponse(null, "Verification email sent");
  } catch (error) {
    console.error("Error subscribing:", error);
    return createErrorResponse("Failed to subscribe", 500);
  }
}


