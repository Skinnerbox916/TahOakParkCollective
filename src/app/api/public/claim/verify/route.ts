import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { MagicLinkPurpose, ApprovalType, ApprovalStatus, ROLE } from "@/lib/prismaEnums";
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
      include: {
        categories: true,
        tags: { include: { tag: true } },
      },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Check if user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: magicLink.email },
      select: { id: true },
    });

    const snapshot = {
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      address: entity.address,
      phone: entity.phone,
      website: entity.website,
      latitude: entity.latitude,
      longitude: entity.longitude,
      entityType: entity.entityType as any,
      hours: entity.hours as any,
      socialMedia: entity.socialMedia as any,
      displaySettings: (entity as any).displaySettings || null,
      categorySlugs: entity.categories.map((c) => c.slug),
      tagSlugs: (entity.tags || []).map((t) => t.tag?.slug).filter(Boolean),
      ownerId: existingUser?.id || entity.ownerId,
    };

    const approval = await prisma.approval.create({
      data: {
        targetEntityId: entity.id,
        type: ApprovalType.UPDATE_ENTITY,
        proposedEntityData: snapshot as any,
        submitterEmail: magicLink.email,
        notes: existingUser
          ? `User exists: ${existingUser.id}`
          : `User does not exist yet. Email: ${magicLink.email}`,
        status: ApprovalStatus.PENDING,
        source: "public",
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
        approvalId: approval.id,
      },
      "Claim request submitted for admin review"
    );
  } catch (error) {
    console.error("Error verifying claim:", error);
    return createErrorResponse("Failed to verify claim", 500);
  }
}
