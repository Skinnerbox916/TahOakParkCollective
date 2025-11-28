import { EntityType } from "@/lib/prismaEnums";
import { useTranslations } from "next-intl";

/**
 * Client-side hook to get translated EntityType labels
 * Use this in client components
 */
export function useEntityTypeLabels() {
  const t = useTranslations("entityTypes");
  
  return {
    COMMERCE: t("commerce"),
    CIVIC: t("civic"),
    ADVOCACY: t("advocacy"),
    PUBLIC_SPACE: t("publicSpace"),
    NON_PROFIT: t("nonProfit"),
    EVENT: t("event"),
    SERVICE_PROVIDER: t("serviceProvider"),
  } as Record<EntityType, string>;
}

/**
 * Server-side function to get translated EntityType labels
 * Use this in server components or API routes
 * @param locale - The locale string (e.g., "en", "es")
 * @returns Record of EntityType to translated label
 */
export async function getEntityTypeLabels(locale: string): Promise<Record<EntityType, string>> {
  const messages = (await import(`../messages/${locale}.json`)).default;
  const t = (key: string) => messages.entityTypes?.[key] || key;
  
  return {
    COMMERCE: t("commerce"),
    CIVIC: t("civic"),
    ADVOCACY: t("advocacy"),
    PUBLIC_SPACE: t("publicSpace"),
    NON_PROFIT: t("nonProfit"),
    EVENT: t("event"),
    SERVICE_PROVIDER: t("serviceProvider"),
  } as Record<EntityType, string>;
}

/**
 * Get a single translated EntityType label (server-side)
 * @param entityType - The EntityType enum value
 * @param locale - The locale string (e.g., "en", "es")
 * @returns Translated label string
 */
export async function getEntityTypeLabel(entityType: EntityType, locale: string): Promise<string> {
  const labels = await getEntityTypeLabels(locale);
  return labels[entityType] || entityType;
}





