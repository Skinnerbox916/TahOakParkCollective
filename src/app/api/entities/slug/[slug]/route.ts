import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const { slug } = await params;
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only return active entities for public API
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Map entity to include translated content
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

    // Translate tags if present
    if (entity.tags && Array.isArray(entity.tags)) {
      translatedEntity.tags = entity.tags.map((entityTag: any) => {
        if (entityTag.tag) {
          return {
            ...entityTag,
            tag: {
              ...entityTag.tag,
              name: getTranslatedField(
                entityTag.tag.nameTranslations,
                locale,
                entityTag.tag.name
              ),
            },
          };
        }
        return entityTag;
      });
    }

    return createSuccessResponse(translatedEntity);
  } catch (error) {
    console.error("Error fetching entity by slug:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

