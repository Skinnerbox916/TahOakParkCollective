import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { EntityDetail } from "@/components/entity/EntityDetail";
import type { EntityWithRelations } from "@/types";

async function getEntityBySlug(slug: string): Promise<EntityWithRelations | null> {
  try {
    const entity = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only show active entities publicly
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
      },
    });

    return entity as EntityWithRelations | null;
  } catch (error) {
    console.error("Error fetching entity:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);

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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  return <EntityDetail entity={entity} />;
}

