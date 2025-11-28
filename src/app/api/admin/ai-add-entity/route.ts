import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
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
      
      if (researchResult.address) {
        const geocodeResult = await geocodeAddress(researchResult.address);
        
        if (geocodeResult) {
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
        } else {
          // If geocoding fails, we can't validate coverage - return error
          return createErrorResponse(
            "Could not verify address location. Please ensure the entity is within the TahOak Park Collective coverage area.",
            400
          );
        }
      }
      // If no address (mobile services, home-based, etc.), assume it's in coverage area

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
      if (!researchResult.entityType || !validEntityTypes.includes(researchResult.entityType as any)) {
        return createErrorResponse(
          `Invalid entity type: ${researchResult.entityType}. Must be one of: ${validEntityTypes.join(", ")}`,
          400
        );
      }

      // Resolve category slugs to IDs
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

      // Resolve tag slugs to IDs (if tags provided)
      let tagIds: string[] = [];
      if (researchResult.tagSlugs && researchResult.tagSlugs.length > 0) {
        const tags = await prisma.tag.findMany({
          where: {
            slug: { in: researchResult.tagSlugs },
          },
          select: { id: true },
        });
        tagIds = tags.map((tag) => tag.id);
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
        const cleaned: any = {};
        for (const [key, value] of Object.entries(researchResult.socialMedia)) {
          if (value && typeof value === "string" && value.trim()) {
            cleaned[key] = value.trim();
          }
        }
        cleanedSocialMedia = Object.keys(cleaned).length > 0 ? cleaned : null;
      }

      // Create entity with PENDING status
      const entity = await prisma.entity.create({
        data: {
          name: researchResult.name,
          slug: uniqueSlug,
          description: researchResult.description,
          address: researchResult.address || null,
          phone: researchResult.phone || null,
          website: researchResult.website || null,
          latitude: entityLatitude,
          longitude: entityLongitude,
          entityType: researchResult.entityType as any,
          status: ENTITY_STATUS.PENDING,
          ownerId: adminUser.id,
          hours: researchResult.hours || null,
          socialMedia: cleanedSocialMedia,
          nameTranslations: researchResult.nameTranslations || null,
          descriptionTranslations: researchResult.descriptionTranslations || null,
          categories: {
            connect: categories.map((cat) => ({ id: cat.id })),
          },
        },
        include: {
          categories: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Add tags if any
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await prisma.entityTag.create({
            data: {
              entityId: entity.id,
              tagId,
              verified: true, // Admin-added tags are verified
              createdBy: adminUser.id,
            },
          });
        }
      }

      // Fetch entity with tags for response
      const entityWithTags = await prisma.entity.findUnique({
        where: { id: entity.id },
        include: {
          categories: true,
          tags: {
            include: {
              tag: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return createSuccessResponse(
        entityWithTags,
        `Entity "${researchResult.name}" added successfully! Status: Pending`
      );
    } catch (error: any) {
      console.error("Error in AI entity addition:", error);
      
      // Handle specific AI research errors
      if (error.message?.includes("AI returned invalid JSON")) {
        return createErrorResponse(
          "Could not process entity data. Please try again or add manually.",
          500
        );
      }

      if (error.message?.includes("missing required fields")) {
        return createErrorResponse(
          "Missing required information. Please try again or add manually.",
          400
        );
      }

      return createErrorResponse(
        error.message || "Failed to research and add entity. Please try again or add manually.",
        500
      );
    }
  });
}

