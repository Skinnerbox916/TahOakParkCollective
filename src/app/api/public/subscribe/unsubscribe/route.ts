import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return createErrorResponse("Token required", 400);
    }
    
    const magicLink = await prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink) return createErrorResponse("Invalid token", 400);
    
    await prisma.subscriber.update({
        where: { email: magicLink.email },
        data: { unsubscribed: true, unsubscribedAt: new Date() }
    });
    
    return createSuccessResponse(null, "Unsubscribed successfully");
  } catch (error) {
    return createErrorResponse("Failed to unsubscribe", 500);
  }
}


