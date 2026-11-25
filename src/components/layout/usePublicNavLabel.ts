"use client";

import { useTranslations } from "next-intl";

/** Labels for the public nav items in src/lib/navigation.ts (desktop bar and mobile menu). */
export function usePublicNavLabel() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  return (labelKey: string) => {
    switch (labelKey) {
      case "directory": return t("directory");
      case "suggest": return tNav("suggest");
      case "report": return tNav("report");
      case "listBusiness": return tNav("listBusiness");
      case "subscribe": return tNav("subscribe");
      default: return labelKey;
    }
  };
}
