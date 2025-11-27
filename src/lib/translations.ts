import { Prisma } from "@prisma/client";
import { routing } from "@/i18n/routing";

/**
 * Type definition for translation JSON structure
 * Example: { "en": "Coffee Shop", "es": "Cafetería" }
 */
export type TranslationJson = {
  [locale: string]: string;
} | null;

/**
 * Extracts translated value from JSON translation object
 * @param translations - JSON object with locale keys
 * @param locale - Desired locale (e.g., "en", "es")
 * @param fallback - Fallback value if translation not found
 * @returns Translated string or fallback
 */
export function getTranslatedField(
  translations: Prisma.JsonValue | null,
  locale: string,
  fallback: string
): string {
  // Handle null or undefined
  if (!translations) {
    return fallback;
  }

  // Handle non-object values
  if (typeof translations !== "object" || Array.isArray(translations)) {
    return fallback;
  }

  const translationObj = translations as TranslationJson;

  // Try requested locale first
  if (translationObj[locale] && typeof translationObj[locale] === "string") {
    return translationObj[locale];
  }

  // Fallback to English
  if (translationObj["en"] && typeof translationObj["en"] === "string") {
    return translationObj["en"];
  }

  // Fallback to first available translation
  const firstKey = Object.keys(translationObj)[0];
  if (firstKey && typeof translationObj[firstKey] === "string") {
    return translationObj[firstKey];
  }

  // Final fallback
  return fallback;
}

/**
 * Validates that a locale is supported
 */
export function isValidLocale(locale: string | null): locale is string {
  return locale !== null && routing.locales.includes(locale as any);
}



