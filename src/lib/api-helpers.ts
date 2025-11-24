import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import type { Role } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";

export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function createErrorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

export async function withAuth<T>(
  handler: (user: { id: string; roles: Role[] }) => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth();
    return await handler(user as { id: string; roles: Role[] });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse("Authentication required", 401);
  }
}

export async function withRole<T>(
  allowedRoles: Role[],
  handler: (user: { id: string; roles: Role[] }) => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  try {
    const user = await requireRole(allowedRoles);
    return await handler(user as { id: string; roles: Role[] });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return createErrorResponse("Unauthorized", 401);
      }
      if (error.message === "Forbidden") {
        return createErrorResponse("Forbidden", 403);
      }
    }
    return createErrorResponse("Access denied", 403);
  }
}

export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && data[field].trim() === "")) {
      return `${field} is required`;
    }
  }
  return null;
}

