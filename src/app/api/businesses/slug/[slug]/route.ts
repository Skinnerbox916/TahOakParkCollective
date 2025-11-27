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
    const business = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only return active businesses for public API
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

    if (!business) {
      return createErrorResponse("Business not found", 404);
    }

    // Map business to include translated content
    const translatedBusiness = {
      ...business,
      name: getTranslatedField(business.nameTranslations, locale, business.name),
      description: business.description
        ? getTranslatedField(business.descriptionTranslations, locale, business.description)
        : null,
    };

    // Translate category if present
    if (business.category) {
      translatedBusiness.category = {
        ...business.category,
        name: getTranslatedField(
          business.category.nameTranslations,
          locale,
          business.category.name
        ),
        description: business.category.description
          ? getTranslatedField(
              business.category.descriptionTranslations,
              locale,
              business.category.description
            )
          : null,
      };
    }

    // Translate tags if present
    if (business.tags && Array.isArray(business.tags)) {
      translatedBusiness.tags = business.tags.map((entityTag: any) => {
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

    return createSuccessResponse(translatedBusiness);
  } catch (error) {
    console.error("Error fetching business by slug:", error);
    return createErrorResponse("Failed to fetch business", 500);
  }
}

