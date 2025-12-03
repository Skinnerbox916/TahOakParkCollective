import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE, ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludeStandard, transformEntity } from "@/lib/entity-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const locale = getLocaleFromRequest(request);
    const { id } = await params;
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: entityIncludeStandard,
    });

    if (!entity) {
      return createErrorResponse("Entity not found", 404);
    }

    // Map entity to include translated content
    const translatedEntity = transformEntity(entity, locale);

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
      const { name, description, address, phone, website, categoryIds, status, entityType, socialMedia, hours, seoTitleTranslations, seoDescriptionTranslations } = body;

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

      // Handle hours - clean empty values or set to null if explicitly cleared
      if (hours !== undefined) {
        if (hours === null) {
          updateData.hours = null;
        } else if (typeof hours === 'object') {
          // Clean hours - remove days with no data
          const cleaned: any = {};
          for (const [day, dayHours] of Object.entries(hours)) {
            if (dayHours && typeof dayHours === 'object') {
              const dh = dayHours as any;
              if (dh.closed || (dh.open && dh.close)) {
                cleaned[day] = dayHours;
              }
            }
          }
          updateData.hours = Object.keys(cleaned).length > 0 ? cleaned : null;
        }
      }

      // Handle SEO translation fields
      if (seoTitleTranslations !== undefined) {
        if (seoTitleTranslations === null) {
          updateData.seoTitleTranslations = null;
        } else if (typeof seoTitleTranslations === 'object') {
          const cleaned: any = {};
          for (const [locale, value] of Object.entries(seoTitleTranslations)) {
            if (value && typeof value === 'string' && value.trim()) {
              cleaned[locale] = value.trim();
            }
          }
          updateData.seoTitleTranslations = Object.keys(cleaned).length > 0 ? cleaned : null;
        }
      }

      if (seoDescriptionTranslations !== undefined) {
        if (seoDescriptionTranslations === null) {
          updateData.seoDescriptionTranslations = null;
        } else if (typeof seoDescriptionTranslations === 'object') {
          const cleaned: any = {};
          for (const [locale, value] of Object.entries(seoDescriptionTranslations)) {
            if (value && typeof value === 'string' && value.trim()) {
              cleaned[locale] = value.trim();
            }
          }
          updateData.seoDescriptionTranslations = Object.keys(cleaned).length > 0 ? cleaned : null;
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

      // If Owner, create Approval request
      // Store the entire updateData as newValue
      if (Object.keys(updateData).length === 0) {
         return createErrorResponse("No changes provided", 400);
      }

      const approval = await prisma.approval.create({
        data: {
          entityId: id,
          type: ApprovalType.UPDATE_ENTITY,
          newValue: updateData,
          submittedBy: user.id,
          submitterEmail: user.email,
          status: ApprovalStatus.PENDING,
          source: "owner",
        },
      });

      return createSuccessResponse(approval, "Changes submitted for review");

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
