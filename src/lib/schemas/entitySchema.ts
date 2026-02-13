import { z } from "zod";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import { parsePhoneToE164 } from "@/lib/phone";
import type { BusinessHours, SocialMediaLinks } from "@/types";

// Helper for fields that should be trimmed and nulled if empty
const normalizedString = z.any().transform((val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str === "" ? null : str;
});

// Phone field with normalization and validation
const phoneField = z.any().transform((val, ctx) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === "") return null;
  
  const e164 = parsePhoneToE164(str, "US");
  if (!e164) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validation.invalidPhone",
    });
    return z.NEVER;
  }
  return e164;
});

// URL field with normalization and validation
const urlField = z.any().transform((val, ctx) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === "") return null;

  const normalized = normalizeUrl(str);
  if (!normalized) return null;
  
  if (!isValidUrl(normalized)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validation.invalidWebsite",
    });
    return z.NEVER;
  }
  
  return normalized;
});

// Social media field with normalization and validation
const socialMediaField = z.any().transform((val, ctx) => {
  if (!val || typeof val !== "object" || Array.isArray(val)) return null;
  const cleaned: Record<string, string> = {};
  const entries = Object.entries(val as Record<string, any>);
  
  for (const [platform, value] of entries) {
    if (!value || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    
    const normalized = normalizeUrl(trimmed);
    if (!normalized) continue;
    
    if (!isValidUrl(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "validation.invalidSocialUrl",
        path: [platform],
      });
      continue;
    }
    
    cleaned[platform] = normalized;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
});

// Hours field with normalization and validation
const hoursField = z.any().transform((val, ctx) => {
  if (!val || typeof val !== "object" || Array.isArray(val)) return null;
  const cleaned: BusinessHours = {};
  const entries = Object.entries(val as Record<string, any>);
  
  for (const [day, raw] of entries) {
    if (!raw || typeof raw !== "object") continue;
    const open = typeof raw.open === "string" ? raw.open : null;
    const close = typeof raw.close === "string" ? raw.close : null;
    const closed = raw.closed === true;
    
    if (closed || open || close) {
      cleaned[day] = {
        open: open ?? null,
        close: close ?? null,
        closed,
      };
    }
  }
  
  if (Object.keys(cleaned).length === 0) return null;
  
  // Validation for hours structure
  for (const [day, hours] of Object.entries(cleaned)) {
    if (!hours.closed && (!hours.open || !hours.close)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "validation.invalidHours",
        path: [day],
      });
    }
  }
  
  return cleaned;
});

// Even more permissive record helper
const permissiveAny = z.any().optional().nullable();

export const entityInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "validation.nameRequired" })
    .transform((v) => v.trim()),
  description: normalizedString,
  address: normalizedString,
  phone: phoneField,
  website: urlField,
  socialMedia: socialMediaField,
  hours: hoursField,
  displaySettings: permissiveAny,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  ownerId: z.string().optional(),
  entityType: z.any().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  categorySlugs: z.array(z.string()).optional(),
  tagSlugs: z.array(z.string()).optional(),
  seoTitleTranslations: permissiveAny,
  seoDescriptionTranslations: permissiveAny,
  nameTranslations: permissiveAny,
  descriptionTranslations: permissiveAny,
  images: z.any().optional(),
  slug: z.string().optional(),
  status: z.any().optional(),
}).passthrough(); // Use passthrough to be extra safe

export type EntityInput = z.infer<typeof entityInputSchema>;

export function validateEntityInput(
  data: unknown
): { success: true; data: EntityInput } | { success: false; fieldErrors: Record<string, string>; error: string } {
  try {
    const result = entityInputSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }

    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message || "validation.fixErrors";
      }
    }

    return {
      success: false,
      fieldErrors,
      error: "validation.fixErrors",
    };
  } catch (err) {
    console.error("Zod validation crashed:", err);
    return {
      success: false,
      fieldErrors: { form: "validation.fixErrors" },
      error: "validation.fixErrors",
    };
  }
}
