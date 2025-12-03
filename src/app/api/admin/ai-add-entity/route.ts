import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ENTITY_TYPE, ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";
import { researchEntity } from "@/lib/ai/entity-research";
import { generateSlug } from "@/lib/utils";
import { geocodeAddress } from "@/lib/geocoding";
import { validateCoverage } from "@/lib/coverage-areas";

export async function POST(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { entityName } = body;

      if (!entityName || typeof entityName !== "string" || !entityName.trim()) {
        return createErrorResponse("Entity name is required", 400);
      }

      // Research entity using AI (assumes coverage area)
      const researchResult = await researchEntity(entityName.trim());

      // Check for duplicate
      if (researchResult.duplicateCheck?.isDuplicate) {
        const existingName = researchResult.duplicateCheck.existingEntityName || "an existing entity";
        return createErrorResponse(
          `This entity already exists: ${existingName}`,
          409
        );
      }

      // Validate coverage area if address exists and store coordinates
      let entityLatitude: number | null = null;
      let entityLongitude: number | null = null;
      
      // Determine if address is required based on entity type
      const addressRequiredTypes = [
        ENTITY_TYPE.COMMERCE,
        ENTITY_TYPE.PUBLIC_SPACE,
        ENTITY_TYPE.NON_PROFIT,
      ];
      const addressRequired = addressRequiredTypes.includes(researchResult.entityType as typeof ENTITY_TYPE[keyof typeof ENTITY_TYPE]);
      
      if (researchResult.address) {
        // Check if address looks like a street address (contains numbers)
        // This helps avoid trying to geocode business names
        const addressHasNumbers = /\d/.test(researchResult.address);
        
        if (!addressHasNumbers) {
          // Address doesn't look like a street address (probably just a business name)
          return createErrorResponse(
            `Invalid address format: "${researchResult.address}". The address must be a full street address (e.g., "123 Main Street, Sacramento, CA 95820"), not just a business name. Please ensure the AI research found a complete street address.`,
            400
          );
        }

        const geocodeResult = await geocodeAddress(researchResult.address);
        
        if (!geocodeResult) {
          // Geocoding failed - reject if address is required, otherwise allow without coordinates
          if (addressRequired) {
            return createErrorResponse(
              `Could not verify address location: "${researchResult.address}". The address could not be geocoded, which suggests it may be incomplete or incorrect. For ${researchResult.entityType} entities, a complete, verifiable address is required.`,
              400
            );
          } else {
            // Address optional - log warning but allow through
            console.warn(`Geocoding failed for optional address: "${researchResult.address}". Approval will be created without coordinates.`);
          }
        } else {
          // Geocoding succeeded - validate coverage area
          const coverageValidation = validateCoverage(
            geocodeResult.latitude,
            geocodeResult.longitude
          );

          if (!coverageValidation.inCoverage) {
            return createErrorResponse(
              `This entity is outside the coverage area. ${coverageValidation.message}`,
              400
            );
          }

          // Store geocoded coordinates
          entityLatitude = geocodeResult.latitude;
          entityLongitude = geocodeResult.longitude;
        }
      } else if (addressRequired) {
        // Address is required but not provided
        return createErrorResponse(
          `Address is required for ${researchResult.entityType} entities but was not found. Please ensure the AI research found a complete street address for this entity.`,
          400
        );
      }
      // If no address and not required (mobile services, home-based, etc.), assume it's in coverage area

      // Check if category guidance is needed
      if (researchResult.needsCategoryGuidance) {
        return createErrorResponse(
          "Entity does not fit existing categories. Please add manually or create appropriate categories first.",
          400
        );
      }

      // Validate required fields
      if (!researchResult.categorySlugs || researchResult.categorySlugs.length === 0) {
        return createErrorResponse(
          "Entity must have at least one category",
          400
        );
      }

      // Validate entity type
      const validEntityTypes = Object.values(ENTITY_TYPE);
      if (!researchResult.entityType || !validEntityTypes.includes(researchResult.entityType as typeof ENTITY_TYPE[keyof typeof ENTITY_TYPE])) {
        return createErrorResponse(
          `Invalid entity type: ${researchResult.entityType}. Must be one of: ${validEntityTypes.join(", ")}`,
          400
        );
      }

      // Verify categories exist
      const categories = await prisma.category.findMany({
        where: {
          slug: { in: researchResult.categorySlugs },
        },
        select: { id: true, slug: true },
      });

      if (categories.length === 0) {
        return createErrorResponse(
          "None of the provided category slugs were found",
          400
        );
      }

      // Verify tags exist (if provided)
      if (researchResult.tagSlugs && researchResult.tagSlugs.length > 0) {
        const tags = await prisma.tag.findMany({
          where: {
            slug: { in: researchResult.tagSlugs },
          },
          select: { id: true, slug: true },
        });
        // Use only valid tag slugs
        researchResult.tagSlugs = tags.map((tag) => tag.slug);
      }

      // Get admin user ID for ownerId
      const adminUser = await prisma.user.findFirst({
        where: {
          roles: { has: ROLE.ADMIN },
        },
        select: { id: true },
      });

      if (!adminUser) {
        return createErrorResponse("Admin user not found", 500);
      }

      // Generate slug and ensure uniqueness
      const baseSlug = generateSlug(researchResult.name);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (await prisma.entity.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Clean social media - remove empty values
      let cleanedSocialMedia = null;
      if (researchResult.socialMedia && typeof researchResult.socialMedia === "object") {
        const cleaned: Record<string, string> = {};
        for (const [key, value] of Object.entries(researchResult.socialMedia)) {
          if (value && typeof value === "string" && value.trim()) {
            cleaned[key] = value.trim();
          }
        }
        cleanedSocialMedia = Object.keys(cleaned).length > 0 ? cleaned : null;
      }

      // Build entity data to store in Approval
      const entityData = {
        name: researchResult.name,
        slug: uniqueSlug,
        description: researchResult.description,
        address: researchResult.address || null,
        phone: researchResult.phone || null,
        website: researchResult.website || null,
        latitude: entityLatitude,
        longitude: entityLongitude,
        entityType: researchResult.entityType,
        hours: researchResult.hours || null,
        socialMedia: cleanedSocialMedia,
        nameTranslations: researchResult.nameTranslations || null,
        descriptionTranslations: researchResult.descriptionTranslations || null,
        categorySlugs: researchResult.categorySlugs,
        tagSlugs: researchResult.tagSlugs || [],
        ownerId: adminUser.id,
      };

      // Create Approval record instead of Entity
      const approval = await prisma.approval.create({
        data: {
          type: ApprovalType.NEW_ENTITY,
          status: ApprovalStatus.PENDING,
          entityData,
          submittedBy: user.id,
          source: "ai",
        },
      });

      return createSuccessResponse(
        { approval, entityData },
        `Entity "${researchResult.name}" submitted for approval!`
      );
    } catch (error: unknown) {
      console.error("Error in AI entity addition:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle specific AI research errors
      if (errorMessage.includes("OPENAI_API_KEY")) {
        return createErrorResponse(
          "OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.",
          500
        );
      }

      if (errorMessage.includes("AI returned invalid JSON")) {
        return createErrorResponse(
          "Could not process entity data. Please try again or add manually.",
          500
        );
      }

      if (errorMessage.includes("missing required fields")) {
        return createErrorResponse(
          "Missing required information. Please try again or add manually.",
          400
        );
      }

      return createErrorResponse(
        errorMessage || "Failed to research and add entity. Please try again or add manually.",
        500
      );
    }
  });
}
