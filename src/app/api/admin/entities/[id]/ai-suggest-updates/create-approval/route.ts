import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse, withRole } from "@/lib/api-helpers";
import { ApprovalStatus, ApprovalType, ROLE } from "@/lib/prismaEnums";
import { entityIncludeStandard } from "@/lib/entity-helpers";
import { normalizeSnapshot, type EntitySnapshot } from "@/lib/entitySnapshot";
import type { BusinessHours, SocialMediaLinks } from "@/types";

const ALLOWED_FIELDS = new Set([
  "name",
  "description",
  "address",
  "phone",
  "website",
  "entityType",
  "categorySlugs",
  "tagSlugs",
  "hours",
  "socialMedia",
  "nameTranslations",
  "descriptionTranslations",
  "seoTitleTranslations",
  "seoDescriptionTranslations",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { acceptedSuggestions } = body || {};

      if (!Array.isArray(acceptedSuggestions) || acceptedSuggestions.length === 0) {
        return createErrorResponse("acceptedSuggestions must be a non-empty array", 400);
      }

      const entity = await prisma.entity.findUnique({
        where: { id },
        include: entityIncludeStandard,
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      const baseSnapshot: EntitySnapshot = {
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        descriptionTranslations: entity.descriptionTranslations as Record<string, string> | null,
        nameTranslations: entity.nameTranslations as Record<string, string> | null,
        address: entity.address,
        phone: entity.phone,
        website: entity.website,
        latitude: entity.latitude,
        longitude: entity.longitude,
        ownerId: entity.ownerId,
        entityType: entity.entityType,
        hours: entity.hours as BusinessHours | null,
        socialMedia: entity.socialMedia as SocialMediaLinks | null,
        displaySettings: entity.displaySettings as Record<string, boolean | undefined> | null,
        categorySlugs: (entity.categories || []).map((c) => c.slug),
        tagSlugs: (entity.tags || []).map((et) => et.tag?.slug).filter(Boolean) as string[],
        images: entity.images as unknown,
        seoTitleTranslations: (entity as any).seoTitleTranslations ?? null,
        seoDescriptionTranslations: (entity as any).seoDescriptionTranslations ?? null,
      };

      const updatedSnapshot: EntitySnapshot = { ...baseSnapshot };

      for (const suggestion of acceptedSuggestions) {
        if (!suggestion || typeof suggestion.field !== "string") continue;
        if (!ALLOWED_FIELDS.has(suggestion.field)) continue;
        (updatedSnapshot as any)[suggestion.field] = suggestion.suggestedValue;
      }

      const normalized = normalizeSnapshot(updatedSnapshot);

      const approval = await prisma.approval.create({
        data: {
          type: ApprovalType.UPDATE_ENTITY,
          status: ApprovalStatus.PENDING,
          targetEntityId: entity.id,
          proposedEntityData: normalized as any,
          submittedBy: user.id,
          submitterEmail: user.email,
          source: "ai_suggest",
        },
        select: { id: true },
      });

      return createSuccessResponse({ approvalId: approval.id }, "Approval created");
    } catch (error: unknown) {
      console.error("Error creating AI suggestion approval:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return createErrorResponse(errorMessage || "Failed to create approval", 500);
    }
  });
}

