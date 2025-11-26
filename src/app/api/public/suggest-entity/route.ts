import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { SuggestionStatus } from "@/lib/prismaEnums";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, address, website, submitterEmail, submitterName } = body;

    if (!name || !submitterEmail) {
      return createErrorResponse("Name and email are required", 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Create suggestion
    const suggestion = await prisma.entitySuggestion.create({
      data: {
        name,
        description,
        address,
        website,
        submitterEmail,
        submitterName,
        status: SuggestionStatus.PENDING,
      },
    });

    return createSuccessResponse(suggestion, "Suggestion submitted successfully");
  } catch (error) {
    console.error("Error submitting entity suggestion:", error);
    return createErrorResponse("Failed to submit suggestion", 500);
  }
}


