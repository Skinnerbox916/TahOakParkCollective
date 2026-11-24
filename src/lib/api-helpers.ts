import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import type { Role } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";
import { ValidationError } from "@/lib/normalizeEntityInput";
import { EntityServiceError } from "@/lib/entities/errors";

export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  fieldErrors?: Record<string, string>,
  extra?: { code?: string; details?: Record<string, unknown> }
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(fieldErrors && { fieldErrors }),
      ...(extra?.code && { code: extra.code }),
      ...(extra?.details && { details: extra.details }),
    },
    { status }
  );
}

/**
 * Turn an error from the entity service (src/lib/entities) into a response.
 * Anything unexpected is logged and becomes a generic 500.
 */
export function entityErrorResponse(error: unknown, fallback = "Something went wrong"): NextResponse<ApiResponse> {
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, 400, error.fieldErrors, { code: "validation" });
  }
  if (error instanceof EntityServiceError) {
    return createErrorResponse(error.message, error.status, undefined, { code: error.code, details: error.details });
  }
  console.error(fallback, error);
  return createErrorResponse(fallback, 500);
}

export async function withAuth<T>(
  handler: (user: { id: string; roles: Role[]; email?: string | null }) => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth();
    return await handler(user as { id: string; roles: Role[]; email?: string | null });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse("Authentication required", 401);
  }
}

export async function withRole<T>(
  allowedRoles: Role[],
  handler: (user: { id: string; roles: Role[]; email?: string | null }) => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  try {
    const user = await requireRole(allowedRoles);
    return await handler(user as { id: string; roles: Role[]; email?: string | null });
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

