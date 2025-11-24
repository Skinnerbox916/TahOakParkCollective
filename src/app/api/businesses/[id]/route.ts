import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({
      where: { id },
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

    if (!business) {
      return createErrorResponse("Business not found", 404);
    }

    return createSuccessResponse(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return createErrorResponse("Failed to fetch business", 500);
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
      const { name, description, address, phone, website, categoryId, status, localTier } = body;

      // Check if business exists
      const existingBusiness = await prisma.business.findUnique({
        where: { id },
      });

      if (!existingBusiness) {
        return createErrorResponse("Business not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && existingBusiness.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only update your own business", 403);
      }

      // Restrict status changes to admins only
      if (status !== undefined && !user.roles.includes(ROLE.ADMIN)) {
        return createErrorResponse("Forbidden: Only admins can change business status", 403);
      }

      // Build update data, excluding status if user is not admin
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      // Only include status if user is admin
      if (status !== undefined && user.roles.includes(ROLE.ADMIN)) {
        updateData.status = status;
      }
      // Local tier can be updated by admins or business owners
      if (localTier !== undefined) {
        updateData.localTier = localTier || null;
      }

      const business = await prisma.business.update({
        where: { id },
        data: updateData,
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

      return createSuccessResponse(business, "Business updated successfully");
    } catch (error) {
      console.error("Error updating business:", error);
      return createErrorResponse("Failed to update business", 500);
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

      // Check if business exists
      const business = await prisma.business.findUnique({
        where: { id },
      });

      if (!business) {
        return createErrorResponse("Business not found", 404);
      }

      // Check authorization: user must be owner or admin
      if (!user.roles.includes(ROLE.ADMIN) && business.ownerId !== user.id) {
        return createErrorResponse("Forbidden: You can only delete your own business", 403);
      }

      await prisma.business.delete({
        where: { id },
      });

      return createSuccessResponse(null, "Business deleted successfully");
    } catch (error) {
      console.error("Error deleting business:", error);
      return createErrorResponse("Failed to delete business", 500);
    }
  });
}

