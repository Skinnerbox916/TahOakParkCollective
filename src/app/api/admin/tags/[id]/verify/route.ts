import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // EntityTag ID
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;

      const entityTag = await prisma.entityTag.findUnique({
        where: { id },
      });

      if (!entityTag) {
        return createErrorResponse("Entity tag assignment not found", 404);
      }

      const updated = await prisma.entityTag.update({
        where: { id },
        data: {
          verified: true,
        },
        include: {
          tag: true,
          entity: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      return createSuccessResponse(updated, "Tag verified successfully");
    } catch (error) {
      console.error("Error verifying tag:", error);
      return createErrorResponse("Failed to verify tag", 500);
    }
  });
}


