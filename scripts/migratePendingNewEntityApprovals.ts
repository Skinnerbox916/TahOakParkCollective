import { prisma } from "@/lib/prisma";
import { ENTITY_STATUS, ApprovalStatus, ApprovalType, ROLE } from "@/lib/prismaEnums";
import { generateSlug } from "@/lib/utils";
import { normalizeEntityInput } from "@/lib/normalizeEntityInput";

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { roles: { has: ROLE.ADMIN } },
    select: { id: true },
  });

  if (!adminUser) {
    throw new Error("Admin user not found. Cannot assign owner for migrated entities.");
  }

  const approvals = await prisma.approval.findMany({
    where: {
      type: ApprovalType.NEW_ENTITY,
      status: ApprovalStatus.PENDING,
      entityId: null,
      entityData: { not: null },
    },
  });

  console.log(`Found ${approvals.length} pending NEW_ENTITY approvals to migrate.`);

  for (const approval of approvals) {
    const entityData = approval.entityData as Record<string, any>;
    if (!entityData?.name) {
      console.warn(`Skipping approval ${approval.id} - missing name in entityData`);
      continue;
    }

    // Build unique slug
    const baseSlug = generateSlug(entityData.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.entity.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const normalized = normalizeEntityInput({
      address: entityData.address,
      phone: entityData.phone,
      website: entityData.website,
      hours: entityData.hours,
      socialMedia: entityData.socialMedia,
      displaySettings: entityData.displaySettings,
    });

    const categorySlugs = (entityData.categorySlugs as string[]) || [];
    const tagSlugs = (entityData.tagSlugs as string[]) || [];

    const categories = categorySlugs.length
      ? await prisma.category.findMany({ where: { slug: { in: categorySlugs } }, select: { id: true } })
      : [];

    const tags = tagSlugs.length
      ? await prisma.tag.findMany({ where: { slug: { in: tagSlugs } }, select: { id: true } })
      : [];

    const entity = await prisma.entity.create({
      data: {
        name: entityData.name,
        nameTranslations: entityData.nameTranslations || null,
        slug,
        description: entityData.description || null,
        descriptionTranslations: entityData.descriptionTranslations || null,
        address: normalized.address ?? null,
        phone: normalized.phone ?? null,
        website: normalized.website ?? null,
        latitude: entityData.latitude ?? null,
        longitude: entityData.longitude ?? null,
        entityType: entityData.entityType || "COMMERCE",
        status: ENTITY_STATUS.PENDING_REVIEW,
        hours: normalized.hours ?? null,
        socialMedia: normalized.socialMedia ?? null,
        displaySettings: normalized.displaySettings ?? null,
        ownerId: entityData.ownerId || adminUser.id,
        categories: {
          connect: categories.map((c) => ({ id: c.id })),
        },
      },
    });

    if (tags.length > 0) {
      await prisma.entityTag.createMany({
        data: tags.map((tag) => ({
          entityId: entity.id,
          tagId: tag.id,
          verified: true,
        })),
      });
    }

    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        entityId: entity.id,
      },
    });

    console.log(`Migrated approval ${approval.id} -> entity ${entity.id}`);
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

