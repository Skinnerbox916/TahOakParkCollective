import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose } from "@/lib/prismaEnums";
import { sendMagicLinkEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, entityId } = body;

    if (!email || !entityId) {
      return createErrorResponse("Email and Entity ID are required", 400);
    }

    // Verify entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Generate Magic Link
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.magicLink.create({
      data: {
        email,
        token,
        purpose: MagicLinkPurpose.CLAIM_ENTITY,
        expiresAt,
      },
    });

    // Send verification email with entityId in URL for claim flow
    await sendMagicLinkEmail(email, token, MagicLinkPurpose.CLAIM_ENTITY, entityId);

    return createSuccessResponse(null, "Verification email sent");
  } catch (error) {
    console.error("Error claiming entity:", error);
    return createErrorResponse("Failed to process claim request", 500);
  }
}


