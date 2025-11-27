import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE, ChangeType, ChangeStatus } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const { id } = await params;
    const entity = await prisma.entity.findUnique({
      where: { id },
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
          }
        }
      },
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Map entity to include translated content
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
        name: getTranslatedField(cat.nameTranslations, locale, cat.name),
        description: cat.description
          ? getTranslatedField(cat.descriptionTranslations, locale, cat.description)
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

    return createSuccessResponse(translatedEntity);
  } catch (error) {
    console.error("Error fetching entity:", error);
    return createErrorResponse("Failed to fetch entity", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, description, address, phone, website, categoryIds, status, entityType, socialMedia } = body;

      // Check if entity exists
      const existingEntity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!existingEntity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization
      const isAdmin = user.roles.includes(ROLE.ADMIN);
      const isOwner = existingEntity.ownerId === user.id;

      if (!isAdmin && !isOwner) {
        return createErrorResponse("Forbidden: You can only update your own entity", 403);
      }

      // Build update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      // Handle categories (many-to-many)
      let categoriesUpdate: any = undefined;
      if (categoryIds !== undefined) {
        categoriesUpdate = {
          set: categoryIds.map((id: string) => ({ id })),
        };
      }
      if (entityType !== undefined) updateData.entityType = entityType;
      
      // Handle social media - clean empty values or set to null if explicitly cleared
      if (socialMedia !== undefined) {
        if (socialMedia === null) {
          updateData.socialMedia = null;
        } else if (typeof socialMedia === 'object') {
          // Clean social media - remove empty values
          const cleaned: any = {};
          for (const [key, value] of Object.entries(socialMedia)) {
            if (value && typeof value === 'string' && value.trim()) {
              cleaned[key] = value.trim();
            }
          }
          updateData.socialMedia = Object.keys(cleaned).length > 0 ? cleaned : null;
        }
      }

      // Status changes: Admin only
      if (status !== undefined) {
        if (isAdmin) {
          updateData.status = status;
        } else {
          return createErrorResponse("Forbidden: Only admins can change entity status", 403);
        }
      }

      // If Admin, apply update directly
      if (isAdmin) {
        const entity = await prisma.entity.update({
          where: { id },
          data: {
            ...updateData,
            ...(categoriesUpdate && { categories: categoriesUpdate }),
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
          },
        });
        return createSuccessResponse(entity, "Entity updated successfully");
      }

      // If Owner, create Pending Change
      // Store the entire updateData as newValue
      if (Object.keys(updateData).length === 0) {
         return createErrorResponse("No changes provided", 400);
      }

      const pendingChange = await prisma.pendingChange.create({
        data: {
          entityId: id,
          changeType: ChangeType.UPDATE_ENTITY,
          newValue: updateData,
          submittedBy: user.id,
          submitterEmail: user.email,
          status: ChangeStatus.PENDING,
        },
      });

      return createSuccessResponse(pendingChange, "Changes submitted for review");

    } catch (error) {
      console.error("Error updating entity:", error);
      return createErrorResponse("Failed to update entity", 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params;

      // Check if entity exists
      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && entity.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only delete your own entity", 403);
      }

      await prisma.entity.delete({
        where: { id },
      });

      return createSuccessResponse(null, "Entity deleted successfully");
    } catch (error) {
      console.error("Error deleting entity:", error);
      return createErrorResponse("Failed to delete entity", 500);
    }
  });
}
