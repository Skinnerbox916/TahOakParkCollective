import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { EntityDetail } from "@/components/entity/EntityDetail";
import { getTranslatedField } from "@/lib/translations";
import type { EntityWithRelations } from "@/types";

async function getEntityBySlug(slug: string, locale: string): Promise<EntityWithRelations | null> {
  try {
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: ENTITY_STATUS.ACTIVE, // Only show active entities publicly
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
  
  // Fetch raw entity for SEO fields (need untranslated JSON fields)
  const rawEntity = await prisma.entity.findFirst({
    where: {
      slug,
      status: ENTITY_STATUS.ACTIVE,
    },
    select: {
      name: true,
      nameTranslations: true,
      description: true,
      descriptionTranslations: true,
      seoTitleTranslations: true,
      seoDescriptionTranslations: true,
    },
  });

  if (!rawEntity) {
    return {
      title: "Entity Not Found",
    };
  }

  // Get translated values with fallback chain
  const translatedName = getTranslatedField(rawEntity.nameTranslations, locale, rawEntity.name);
  const translatedDescription = rawEntity.description
    ? getTranslatedField(rawEntity.descriptionTranslations, locale, rawEntity.description)
    : null;
  
  // SEO fields: use SEO translations if available, fall back to name/description
  const seoTitle = getTranslatedField(
    rawEntity.seoTitleTranslations,
    locale,
    `${translatedName} | TahOak Park Collective`
  );
  const seoDescription = getTranslatedField(
    rawEntity.seoDescriptionTranslations,
    locale,
    translatedDescription || `Visit ${translatedName}`
  );

  return {
    title: seoTitle,
    description: seoDescription,
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

