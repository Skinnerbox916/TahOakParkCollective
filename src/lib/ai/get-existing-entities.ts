import { prisma } from "@/lib/prisma";

/**
 * Fetch existing entities for duplicate comparison
 * Returns simplified entity data (name, address, website, slug) for LLM context
 */
export async function getExistingEntitiesForComparison() {
  const entities = await prisma.entity.findMany({
    select: {
      name: true,
      address: true,
      website: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return entities;
}

