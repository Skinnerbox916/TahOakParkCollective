import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { BusinessDetail } from "@/components/business/BusinessDetail";
import { getTranslatedField } from "@/lib/translations";
import type { EntityWithRelations } from "@/types";

async function getBusinessBySlug(slug: string, locale: string): Promise<EntityWithRelations | null> {
  try {
    const business = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only show active businesses publicly
      },
      include: {
        category: true,
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
      return null;
    }

    // Apply translations
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

    return translatedBusiness as EntityWithRelations;
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug, locale);

  if (!business) {
    return {
      title: "Business Not Found",
    };
  }

  return {
    title: `${business.name} | TahOak Park Collective`,
    description:
      business.description ||
      `Visit ${business.name}`,
  };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug, locale);

  if (!business) {
    notFound();
  }

  return <BusinessDetail business={business} />;
}

