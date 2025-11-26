import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose, ChangeType, ChangeStatus, ROLE } from "@/lib/prismaEnums";
import { sendClaimNotificationEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const entityId = searchParams.get("entityId");

    if (!token) {
      return createErrorResponse("Token is required", 400);
    }

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

    if (magicLink.purpose !== MagicLinkPurpose.CLAIM_ENTITY) {
      return createErrorResponse("Invalid token purpose", 400);
    }

    if (!entityId) {
      return createErrorResponse("Entity ID is required", 400);
    }

    // Verify entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Check if user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: magicLink.email },
      select: { id: true },
    });

    // Create pending change for ownership transfer
    // If user doesn't exist, we'll store null and admin can create account or assign existing
    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityId: entity.id,
        changeType: ChangeType.UPDATE_ENTITY,
        fieldName: "ownerId (Claim Request)",
        oldValue: { ownerId: entity.ownerId },
        newValue: existingUser?.id 
          ? { ownerId: existingUser.id } 
          : {}, // Empty object - admin needs to assign ownerId after creating account
        submitterEmail: magicLink.email,
        notes: existingUser 
          ? `User exists: ${existingUser.id}` 
          : `User does not exist yet. Email: ${magicLink.email}`,
        status: ChangeStatus.PENDING,
      },
    });

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true, usedAt: new Date() },
    });

    // Notify admin (if email function exists)
    try {
      const adminUsers = await prisma.user.findMany({
        where: { roles: { has: ROLE.ADMIN } },
        select: { email: true },
      });
      if (adminUsers.length > 0 && adminUsers[0].email) {
        await sendClaimNotificationEmail(
          adminUsers[0].email,
          entity.name,
          magicLink.email
        );
      }
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Don't fail the request if email fails
    }

    return createSuccessResponse(
      { 
        email: magicLink.email,
        entityId: entity.id,
        entityName: entity.name,
        pendingChangeId: pendingChange.id,
      },
      "Claim request submitted for admin review"
    );
  } catch (error) {
    console.error("Error verifying claim:", error);
    return createErrorResponse("Failed to verify claim", 500);
  }
}


