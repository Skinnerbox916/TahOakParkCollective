"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { EntityStatus, Role } from "@/lib/prismaEnums";

type TranslateValues = Record<string, string | number>;

/**
 * Hook that provides helper translators scoped to the `admin` namespace.
 * Usage:
 * const { tDashboard, tCommon } = useAdminTranslations("dashboard");
 * tDashboard("title");
 */
export function useAdminTranslations(scope?: string) {
  const t = useTranslations("admin");
  const prefix = scope ? `${scope}.` : "";

  const translate = (key: string, values?: TranslateValues) =>
    t(`${prefix}${key}`, values);

  const common = useMemo(
    () => ({
      status: (status: EntityStatus) =>
        t(`common.status.${status}`) as string,
      role: (role: Role) => t(`common.roles.${role}`) as string,
    }),
    [t]
  );

  return {
    t: translate,
    tStatus: common.status,
    tRole: common.role,
  };
}

/**
 * Helper to translate portal-specific strings.
 */
export function usePortalTranslations(scope?: string) {
  const t = useTranslations("portal");
  const prefix = scope ? `${scope}.` : "";

  return (key: string, values?: TranslateValues) =>
    t(`${prefix}${key}`, values);
}


