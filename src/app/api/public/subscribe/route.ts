import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose } from "@/lib/prismaEnums";
import { sendSubscriptionVerification } from "@/lib/email";
import { HOUR, isBot, limitRequest } from "@/lib/rate-limit";
import { localeFromCookieHeader, toLocale } from "@/lib/site";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (isBot(body)) return createSuccessResponse(null, "Verification email sent");

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const { preferences } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse("Valid email is required", 400);
    }

    // Each request emails someone: cap per visitor and per address
    const limited = limitRequest(request, "subscribe", [
      ["ip", 3, HOUR],
      [`email:${email}`, 3, 24 * HOUR],
    ]);
    if (limited) return limited;

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
    const locale = toLocale(body.locale ?? localeFromCookieHeader(request.headers.get("cookie")));
    const sent = await sendSubscriptionVerification(email, token, locale);

    if (!sent) {
      return createErrorResponse("Failed to send verification email", 500);
    }

    return createSuccessResponse(null, "Verification email sent");
  } catch (error) {
    console.error("Error subscribing:", error);
    return createErrorResponse("Failed to subscribe", 500);
  }
}


