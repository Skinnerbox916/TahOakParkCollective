/**
 * The editable fields of an entity, how each one is normalized, and who may
 * change it. Every write in src/lib/entities works on EntityState values, so
 * proposals, diffs, conflict checks and the database all agree on one shape.
 */
import { entityInputSchema } from "@/lib/schemas/entitySchema";
import { ValidationError } from "@/lib/normalizeEntityInput";
import { ENTITY_STATUS, ENTITY_TYPE, ROLE } from "@/lib/prismaEnums";
import { generateSlug } from "@/lib/utils";
import type { Role } from "@/lib/prismaEnums";

export const ENTITY_FIELDS = [
  "name",
  "nameTranslations",
  "description",
  "descriptionTranslations",
  "seoTitleTranslations",
  "seoDescriptionTranslations",
  "address",
  "phone",
  "website",
  "latitude",
  "longitude",
  "entityType",
  "hours",
  "socialMedia",
  "displaySettings",
  "images",
  "categorySlugs",
  "tagSlugs",
  "slug",
  "status",
  "featured",
  "spotCheckDate",
  "verificationContact",
] as const;

export type EntityField = (typeof ENTITY_FIELDS)[number];

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Normalized entity values. Dates are ISO strings so states compare and store as JSON. */
export type EntityState = {
  name: string;
  nameTranslations: Record<string, string> | null;
  description: string | null;
  descriptionTranslations: Record<string, string> | null;
  seoTitleTranslations: Record<string, string> | null;
  seoDescriptionTranslations: Record<string, string> | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  entityType: string;
  hours: Json;
  socialMedia: Json;
  displaySettings: Json;
  images: Json;
  categorySlugs: string[];
  tagSlugs: string[];
  slug: string;
  status: string;
  featured: boolean;
  spotCheckDate: string | null;
  verificationContact: string | null;
};

export type EntityChanges = Partial<EntityState>;

/**
 * Fields only an admin may change. Owners propose everything else; their
 * proposals still need an admin's approval. Ownership is not a field at all.
 */
const ADMIN_ONLY_FIELDS: ReadonlySet<EntityField> = new Set<EntityField>([
  "slug",
  "featured",
  "spotCheckDate",
  "verificationContact",
  "images",
]);

export function isAdminActor(roles: readonly Role[] | undefined): boolean {
  return roles?.includes(ROLE.ADMIN) ?? false;
}

/**
 * Throws if a non-admin tries to change an admin-only field. Owners never
 * change status through a proposal: they publish and unpublish (consent.ts).
 */
export function assertFieldsAllowed(changes: EntityChanges, roles: readonly Role[]) {
  if (isAdminActor(roles)) return;
  const forbidden = Object.keys(changes).filter(
    (field) => field === "status" || ADMIN_ONLY_FIELDS.has(field as EntityField)
  );
  if (forbidden.length > 0) {
    throw new ValidationError(
      `Only an admin can change: ${forbidden.join(", ")}`,
      Object.fromEntries(forbidden.map((f) => [f, "validation.adminOnly"]))
    );
  }
}

// --- per-field normalization ------------------------------------------------

const zodShape = entityInputSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { issues: { message: string }[] } } }>;

const ZOD_FIELDS: ReadonlySet<EntityField> = new Set<EntityField>([
  "name",
  "description",
  "address",
  "phone",
  "website",
  "hours",
  "socialMedia",
]);

function cleanTranslations(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned: Record<string, string> = {};
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) cleaned[locale] = text.trim();
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

function cleanSlugList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const slugs = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return Array.from(new Set(slugs)).sort();
}

function cleanJsonObject(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  return entries.length > 0 ? (Object.fromEntries(entries) as Json) : null;
}

function cleanCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Normalize one field. Returns the value or an error message key.
 */
function normalizeField(field: EntityField, value: unknown): { value: unknown } | { error: string } {
  if (ZOD_FIELDS.has(field)) {
    const parsed = zodShape[field].safeParse(value);
    if (!parsed.success) {
      return { error: parsed.error?.issues[0]?.message || "validation.fixErrors" };
    }
    return { value: parsed.data ?? null };
  }

  switch (field) {
    case "nameTranslations":
    case "descriptionTranslations":
    case "seoTitleTranslations":
    case "seoDescriptionTranslations":
      return { value: cleanTranslations(value) };
    case "categorySlugs":
    case "tagSlugs":
      return { value: cleanSlugList(value) };
    case "latitude":
    case "longitude": {
      const n = cleanCoordinate(value);
      return Number.isNaN(n) ? { error: "validation.invalidCoordinates" } : { value: n };
    }
    case "entityType":
      return (Object.values(ENTITY_TYPE) as string[]).includes(value as string)
        ? { value }
        : { error: "validation.invalidEntityType" };
    case "status":
      return (Object.values(ENTITY_STATUS) as string[]).includes(value as string)
        ? { value }
        : { error: "validation.invalidStatus" };
    case "featured":
      return { value: value === true || value === "true" };
    case "spotCheckDate": {
      if (value === null || value === undefined || value === "") return { value: null };
      const date = new Date(value as string);
      return Number.isNaN(date.getTime()) ? { error: "validation.invalidDate" } : { value: date.toISOString() };
    }
    case "verificationContact": {
      const text = typeof value === "string" ? value.trim() : "";
      return { value: text || null };
    }
    case "slug": {
      const slug = typeof value === "string" ? generateSlug(value) : "";
      return slug ? { value: slug } : { error: "validation.slugRequired" };
    }
    case "displaySettings":
    case "images":
      return { value: cleanJsonObject(value) };
    default:
      return { value };
  }
}

/**
 * Normalize every known field present in `input`; unknown keys are ignored.
 * Throws ValidationError (field -> message key) if any field is invalid.
 */
export function normalizeFields(input: Record<string, unknown>): EntityChanges {
  const result: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};
  for (const field of ENTITY_FIELDS) {
    if (!(field in input) || input[field] === undefined) continue;
    const normalized = normalizeField(field, input[field]);
    if ("error" in normalized) fieldErrors[field] = normalized.error;
    else result[field] = normalized.value;
  }
  if (Object.keys(fieldErrors).length > 0) {
    const [first] = Object.values(fieldErrors);
    throw new ValidationError(first, fieldErrors);
  }
  return result as EntityChanges;
}

/** Best-effort normalization for comparisons; falls back to the raw value. */
function comparable(field: EntityField, value: unknown): unknown {
  const normalized = normalizeField(field, value);
  return "error" in normalized ? value : normalized.value;
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
}

export function fieldEquals(field: EntityField, a: unknown, b: unknown): boolean {
  return stableStringify(comparable(field, a)) === stableStringify(comparable(field, b));
}

/** Fields in `incoming` whose value differs from `current`. */
export function diffState(current: EntityState, incoming: EntityChanges): EntityChanges {
  const changes: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(incoming)) {
    if (!fieldEquals(field as EntityField, current[field as EntityField], value)) {
      changes[field] = value;
    }
  }
  return changes as EntityChanges;
}

/**
 * `name` and `description` are the English text. Their translations hold the
 * other languages, with `en` kept equal to the plain field so the two can't
 * drift apart (display reads `en` first). With no other language the
 * translations are null. Pass `current` for updates, where only one side may
 * be changing.
 */
export function mirrorEnglish(next: EntityChanges, current?: EntityState): EntityChanges {
  const out: EntityChanges = { ...next };
  for (const [field, translationsField] of [
    ["name", "nameTranslations"],
    ["description", "descriptionTranslations"],
  ] as const) {
    if (out[field] === undefined && out[translationsField] === undefined) continue;
    const english = out[field] !== undefined ? out[field] : current?.[field];
    const translations = out[translationsField] !== undefined ? out[translationsField] : current?.[translationsField];
    const others = Object.fromEntries(Object.entries(translations ?? {}).filter(([locale]) => locale !== "en"));
    out[translationsField] =
      Object.keys(others).length === 0 ? null : english ? { ...others, en: english } : others;
  }
  return out;
}

/** Fields whose current value no longer matches the value a proposal was based on. */
export function findConflicts(current: EntityState, baseValues: Record<string, unknown>): EntityField[] {
  return Object.keys(baseValues).filter(
    (field) => !fieldEquals(field as EntityField, current[field as EntityField], baseValues[field])
  ) as EntityField[];
}

export function pickState(state: EntityState, fields: string[]): EntityChanges {
  const picked: Record<string, unknown> = {};
  for (const field of fields) picked[field] = state[field as EntityField];
  return picked as EntityChanges;
}
