import type { BusinessHours } from "@/types";
import { entityInputSchema } from "@/lib/schemas/entitySchema";

type SocialMedia = Record<string, string> | null | undefined;

interface NormalizableFields {
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  hours?: BusinessHours | null;
  socialMedia?: SocialMedia;
  displaySettings?: Record<string, boolean | undefined> | null;
}

export class ValidationError extends Error {
  fieldErrors: Record<string, string>;
  
  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Normalize entity input using strict Zod validation.
 * Returns the normalized data or throws a ValidationError if validation fails.
 * No silent fallbacks - callers must handle validation errors.
 */
export function normalizeEntityInput<T extends NormalizableFields>(
  input: T
): T {
  const parsed = entityInputSchema.safeParse(input);
  
  if (!parsed.success) {
    // Build field-specific errors
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message || "validation.fixErrors";
      }
    }
    
    const firstError = parsed.error.issues[0];
    throw new ValidationError(
      firstError.message || "Validation failed",
      fieldErrors
    );
  }
  
  return { ...input, ...parsed.data } as T;
}


