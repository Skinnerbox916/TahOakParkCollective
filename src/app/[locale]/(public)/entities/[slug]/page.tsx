import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { EntityDetail } from "@/components/entity/EntityDetail";
import { getTranslatedField } from "@/lib/translations";
import { entityIncludePublic, transformEntity } from "@/lib/entity-helpers";
import { siteUrl } from "@/lib/site";
import type { EntityWithRelations } from "@/types";

async function getEntityBySlug(slug: string, locale: string): Promise<EntityWithRelations | null> {
  try {
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: ENTITY_STATUS.ACTIVE, // Only show active entities publicly
      },
      include: entityIncludePublic,
    });

    if (!entity) {
      return null;
    }

    const transformed = transformEntity(entity, locale);
    return transformed as EntityWithRelations;
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
      images: true,
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

  // Shared links show the cover photo.
  const cover = (rawEntity.images as { hero?: string } | null)?.hero;

  return {
    title: seoTitle,
    description: seoDescription,
    ...(cover && {
      openGraph: { title: seoTitle, description: seoDescription, images: [`${siteUrl()}${cover}`] },
    }),
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

