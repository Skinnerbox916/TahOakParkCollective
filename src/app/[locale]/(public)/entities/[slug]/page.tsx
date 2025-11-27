import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { EntityDetail } from "@/components/entity/EntityDetail";
import { getTranslatedField } from "@/lib/translations";
import type { EntityWithRelations } from "@/types";

async function getEntityBySlug(slug: string, locale: string): Promise<EntityWithRelations | null> {
  try {
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only show active entities publicly
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
      return null;
    }

    // Apply translations
    const translatedEntity = {
      ...entity,
      name: getTranslatedField(entity.nameTranslations, locale, entity.name),
      description: entity.description
        ? getTranslatedField(entity.descriptionTranslations, locale, entity.description)
        : null,
    };

    // Translate categories if present
    if (entity.categories && Array.isArray(entity.categories)) {
      translatedEntity.categories = entity.categories.map((cat: any) => ({
        ...cat,
        name: getTranslatedField(
          cat.nameTranslations,
          locale,
          cat.name
        ),
        description: cat.description
          ? getTranslatedField(
              cat.descriptionTranslations,
              locale,
              cat.description
            )
          : null,
      }));
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

    return translatedEntity as EntityWithRelations;
  } catch (error) {
    console.error("Error fetching entity:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const entity = await getEntityBySlug(slug, locale);

  if (!entity) {
    return {
      title: "Entity Not Found",
    };
  }

  return {
    title: `${entity.name} | TahOak Park Collective`,
    description:
      entity.description ||
      `Visit ${entity.name}`,
  };
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const entity = await getEntityBySlug(slug, locale);

  if (!entity) {
    notFound();
  }

  return <EntityDetail entity={entity} />;
}

