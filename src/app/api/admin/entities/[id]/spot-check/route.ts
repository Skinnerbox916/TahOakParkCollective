import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;

      const entity = await prisma.entity.findUnique({
        where: { id },
      });

      if (!entity) {
        return createErrorResponse("Entity not found", 404);
      }

      const updated = await prisma.entity.update({
        where: { id },
        data: {
          spotCheckDate: new Date(),
        },
      });

      return createSuccessResponse(updated, "Entity marked as spot checked");
    } catch (error) {
      console.error("Error marking spot check:", error);
      return createErrorResponse("Failed to mark spot check", 500);
    }
  });
}


