import { prisma } from "@/lib/prisma";
import { entityIncludeWithMembers } from "@/lib/entity-helpers";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ENTITY_STATUS } from "@/lib/prismaEnums";

export async function GET() {
  return withRole([ROLE.ADMIN], async () => {
    try {
      // Spot Check Logic:
      // 1. Entities not checked in > 6 months (or never checked)
      // 2. Random active entities

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Find stale entities
      const staleEntities = await prisma.entity.findMany({
        where: {
          status: ENTITY_STATUS.ACTIVE,
          OR: [
            { spotCheckDate: null },
            { spotCheckDate: { lt: sixMonthsAgo } }
          ],
        },
        orderBy: {
          updatedAt: 'asc', // Oldest first
        },
        take: 3, // Take up to 3 stale ones
        include: { members: entityIncludeWithMembers.members }
      });

      // Find random entities to fill up to 5
      const needed = 5 - staleEntities.length;
      let randomEntities: any[] = [];

      if (needed > 0) {
        // Fetch all active IDs to pick random ones
        // Excluding already selected stale ones
        const staleIds = staleEntities.map(e => e.id);
        
        const allActive = await prisma.entity.findMany({
           where: {
             status: ENTITY_STATUS.ACTIVE,
             NOT: {
               id: { in: staleIds }
             }
           },
           select: { id: true }
        });

        // Shuffle and pick 'needed' amount
        const shuffled = allActive.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, needed).map(e => e.id);

        if (selectedIds.length > 0) {
           randomEntities = await prisma.entity.findMany({
             where: { id: { in: selectedIds } },
             include: { members: entityIncludeWithMembers.members }
           });
        }
      }

      const spotCheckList = [...staleEntities, ...randomEntities];

      return createSuccessResponse(spotCheckList);
    } catch (error) {
      console.error("Error generating spot check list:", error);
      return createErrorResponse("Failed to generate spot check list", 500);
    }
  });
}


