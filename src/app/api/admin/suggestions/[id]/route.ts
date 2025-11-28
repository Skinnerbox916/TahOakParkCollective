import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, SuggestionStatus, ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { action, notes, createEntity } = body; // action: 'APPROVE' | 'REJECT'

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        return createErrorResponse("Valid action (APPROVE or REJECT) is required", 400);
      }

      const suggestion = await prisma.entitySuggestion.findUnique({
        where: { id },
      });

      if (!suggestion) {
        return createErrorResponse("Suggestion not found", 404);
      }

      const status = action === "APPROVE" ? SuggestionStatus.APPROVED : SuggestionStatus.REJECTED;

      // If creating entity from suggestion
      let createdEntity = null;
      if (action === "APPROVE" && createEntity) {
        // Generate slug
        const slug = suggestion.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
        
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.entity.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        createdEntity = await prisma.entity.create({
          data: {
            name: suggestion.name,
            slug: uniqueSlug,
            description: suggestion.description,
            address: suggestion.address,
            website: suggestion.website,
            status: ENTITY_STATUS.ACTIVE, // Approved immediately
            entityType: ENTITY_TYPE.COMMERCE, // Default, admin can change later
            ownerId: user.id, // Assigned to admin initially
          },
        });
      }

      const updatedSuggestion = await prisma.entitySuggestion.update({
        where: { id },
        data: {
          status,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });

      return createSuccessResponse({ suggestion: updatedSuggestion, entity: createdEntity }, "Suggestion reviewed successfully");
    } catch (error) {
      console.error("Error reviewing suggestion:", error);
      return createErrorResponse("Failed to review suggestion", 500);
    }
  });
}


