import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { roles } = body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return createErrorResponse("Roles array is required and must not be empty", 400);
      }

      // Validate all role values
      const validRoles = Object.values(ROLE);
      for (const role of roles) {
        if (!validRoles.includes(role)) {
          return createErrorResponse(`Invalid role: ${role}`, 400);
        }
      }

      // Ensure USER role is always included
      const rolesToSet = roles.includes(ROLE.USER) ? roles : [ROLE.USER, ...roles];

      // Get current user to check admin status
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { roles: true },
      });

      if (!currentUser) {
        return createErrorResponse("User not found", 404);
      }

      // Check if removing ADMIN role would leave 0 admins
      const hadAdmin = currentUser.roles.includes(ROLE.ADMIN);
      const willHaveAdmin = rolesToSet.includes(ROLE.ADMIN);

      if (hadAdmin && !willHaveAdmin) {
        // Count how many users have ADMIN role
        const adminCount = await prisma.user.count({
          where: {
            roles: {
              has: ROLE.ADMIN,
            },
          },
        });

        if (adminCount <= 1) {
          return createErrorResponse(
            "Cannot remove the last admin. Please promote another user to admin first.",
            400
          );
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { roles: rolesToSet },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          _count: {
            select: {
              businesses: true,
            },
          },
        },
      });

      return createSuccessResponse(
        {
          ...updatedUser,
          businessCount: updatedUser._count.businesses,
        },
        "User roles updated successfully"
      );
    } catch (error) {
      console.error("Error updating user roles:", error);
      if (error instanceof Error && error.message.includes("Record to update not found")) {
        return createErrorResponse("User not found", 404);
      }
      return createErrorResponse("Failed to update user roles", 500);
    }
  });
}

