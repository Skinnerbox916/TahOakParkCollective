import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    
    // Fetch all featured active entities
    const featuredEntities = await prisma.entity.findMany({
      where: {
        featured: true,
        status: BUSINESS_STATUS.ACTIVE,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map entities to include translated content
    const translatedEntities = featuredEntities.map((entity) => {
      const translatedEntity = {
        ...entity,
        name: getTranslatedField(entity.nameTranslations, locale, entity.name),
        description: entity.description
          ? getTranslatedField(entity.descriptionTranslations, locale, entity.description)
          : null,
      };

      // Translate category if present
      if (entity.category) {
        translatedEntity.category = {
          ...entity.category,
          name: getTranslatedField(
            entity.category.nameTranslations,
            locale,
            entity.category.name
          ),
          description: entity.category.description
            ? getTranslatedField(
                entity.category.descriptionTranslations,
                locale,
                entity.category.description
              )
            : null,
        };
      }

      return translatedEntity;
    });

    // Return random selection (or all if less than desired count)
    // For now, return all featured entities - rotation can be handled client-side
    return createSuccessResponse(translatedEntities);
  } catch (error) {
    console.error("Error fetching featured entities:", error);
    return createErrorResponse("Failed to fetch featured entities", 500);
  }
}

