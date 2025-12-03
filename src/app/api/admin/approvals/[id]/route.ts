import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, ApprovalStatus, ApprovalType, ENTITY_STATUS } from "@/lib/prismaEnums";

// GET - Fetch single approval details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      
      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          entity: {
            include: {
              categories: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              tags: {
                include: {
                  tag: true,
                }
              }
            }
          }
        }
      });

      if (!approval) {
        return createErrorResponse("Approval not found", 404);
      }

      // For NEW_ENTITY approvals, resolve categorySlugs and tagSlugs to full objects
      let resolvedCategories: Array<{ id: string; name: string; slug: string }> = [];
      let resolvedTags: Array<{ id: string; name: string; slug: string; category: string }> = [];

      if (approval.type === ApprovalType.NEW_ENTITY && approval.entityData) {
        const entityData = approval.entityData as Record<string, unknown>;
        
        // Resolve categories
        const categorySlugs = (entityData.categorySlugs as string[]) || [];
        if (categorySlugs.length > 0) {
          resolvedCategories = await prisma.category.findMany({
            where: { slug: { in: categorySlugs } },
            select: { id: true, name: true, slug: true }
          });
        }

        // Resolve tags
        const tagSlugs = (entityData.tagSlugs as string[]) || [];
        if (tagSlugs.length > 0) {
          resolvedTags = await prisma.tag.findMany({
            where: { slug: { in: tagSlugs } },
            select: { id: true, name: true, slug: true, category: true }
          });
        }
      }

      return createSuccessResponse({
        ...approval,
        resolvedCategories,
        resolvedTags,
      });
    } catch (error) {
      console.error("Error fetching approval:", error);
      return createErrorResponse("Failed to fetch approval", 500);
    }
  });
}

// PUT - Approve or reject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { action, notes } = body; // action: 'APPROVE' | 'REJECT'

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        return createErrorResponse("Valid action (APPROVE or REJECT) is required", 400);
      }

      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          entity: true,
        }
      });

      if (!approval) {
        return createErrorResponse("Approval not found", 404);
      }

      if (approval.status !== ApprovalStatus.PENDING) {
        return createErrorResponse("Approval is already processed", 400);
      }

      if (action === "REJECT") {
        // Just mark as rejected
        const updated = await prisma.approval.update({
          where: { id },
          data: {
            status: ApprovalStatus.REJECTED,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes: notes || null,
          },
        });
        return createSuccessResponse(updated, "Approval rejected");
      }

      // APPROVE Logic
      if (action === "APPROVE") {
        switch (approval.type) {
          case ApprovalType.NEW_ENTITY: {
            // Create Entity from entityData
            const entityData = approval.entityData as Record<string, unknown>;
            if (!entityData) {
              return createErrorResponse("No entity data found in approval", 400);
            }

            // Get admin user ID for owner
            const adminUser = await prisma.user.findFirst({
              where: { roles: { has: ROLE.ADMIN } }
            });

            if (!adminUser) {
              return createErrorResponse("No admin user found to assign as owner", 500);
            }

            // Resolve category slugs to IDs
            const categorySlugs = (entityData.categorySlugs as string[]) || [];
            const categories = await prisma.category.findMany({
              where: { slug: { in: categorySlugs } }
            });

            // Resolve tag slugs to IDs
            const tagSlugs = (entityData.tagSlugs as string[]) || [];
            const tags = await prisma.tag.findMany({
              where: { slug: { in: tagSlugs } }
            });

            // Create the entity
            const entity = await prisma.entity.create({
              data: {
                name: entityData.name as string,
                nameTranslations: entityData.nameTranslations as object || null,
                slug: entityData.slug as string,
                description: entityData.description as string || null,
                descriptionTranslations: entityData.descriptionTranslations as object || null,
                address: entityData.address as string || null,
                phone: entityData.phone as string || null,
                website: entityData.website as string || null,
                latitude: entityData.latitude as number || null,
                longitude: entityData.longitude as number || null,
                entityType: entityData.entityType as string || "COMMERCE",
                status: ENTITY_STATUS.ACTIVE,
                hours: entityData.hours as object || null,
                socialMedia: entityData.socialMedia as object || null,
                ownerId: (entityData.ownerId as string) || adminUser.id,
                categories: {
                  connect: categories.map(c => ({ id: c.id }))
                },
              }
            });

            // Create entity tags
            if (tags.length > 0) {
              await prisma.entityTag.createMany({
                data: tags.map(tag => ({
                  entityId: entity.id,
                  tagId: tag.id,
                  verified: true, // Admin approved
                }))
              });
            }

            // Update approval with created entity reference
            const updated = await prisma.approval.update({
              where: { id },
              data: {
                status: ApprovalStatus.APPROVED,
                reviewedBy: user.id,
                reviewedAt: new Date(),
                notes: notes || null,
                entityId: entity.id,
              },
            });

            return createSuccessResponse({ approval: updated, entity }, "Entity created and approved");
          }

          case ApprovalType.UPDATE_ENTITY: {
            if (!approval.entityId) {
              return createErrorResponse("No entity ID associated with this approval", 400);
            }
            
            // Update entity fields with newValue
            const newValue = approval.newValue as Record<string, unknown>;
            await prisma.entity.update({
              where: { id: approval.entityId },
              data: newValue,
            });
            break;
          }

          case ApprovalType.ADD_TAG: {
            if (!approval.entityId) {
              return createErrorResponse("No entity ID associated with this approval", 400);
            }
            
            const newValue = approval.newValue as Record<string, unknown>;
            if (newValue?.tagId) {
              // Check if tag exists
              const tag = await prisma.tag.findUnique({ where: { id: newValue.tagId as string } });
              if (tag) {
                // Upsert EntityTag
                await prisma.entityTag.upsert({
                  where: {
                    entityId_tagId: {
                      entityId: approval.entityId,
                      tagId: newValue.tagId as string,
                    },
                  },
                  update: {
                    verified: true,
                  },
                  create: {
                    entityId: approval.entityId,
                    tagId: newValue.tagId as string,
                    verified: true,
                    createdBy: approval.submittedBy,
                  },
                });
              }
            }
            break;
          }

          case ApprovalType.REMOVE_TAG: {
            if (!approval.entityId) {
              return createErrorResponse("No entity ID associated with this approval", 400);
            }
            
            const newValue = approval.newValue as Record<string, unknown>;
            if (newValue?.tagId) {
              await prisma.entityTag.deleteMany({
                where: {
                  entityId: approval.entityId,
                  tagId: newValue.tagId as string,
                },
              });
            }
            break;
          }

          case ApprovalType.UPDATE_IMAGE: {
            if (!approval.entityId) {
              return createErrorResponse("No entity ID associated with this approval", 400);
            }
            
            // Update images field
            await prisma.entity.update({
              where: { id: approval.entityId },
              data: {
                images: approval.newValue,
              },
            });
            break;
          }
        }

        // Mark approval as APPROVED
        const updated = await prisma.approval.update({
          where: { id },
          data: {
            status: ApprovalStatus.APPROVED,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes: notes || null,
          },
        });

        return createSuccessResponse(updated, "Approval approved and applied");
      }

      return createErrorResponse("Unknown error", 500);
    } catch (error) {
      console.error("Error processing approval:", error);
      return createErrorResponse("Failed to process approval", 500);
    }
  });
}



