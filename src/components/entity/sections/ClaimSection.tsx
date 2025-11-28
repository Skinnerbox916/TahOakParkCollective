"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

interface ClaimSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function ClaimSection({ entity, config }: ClaimSectionProps) {
  const t = useTranslations("entity");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t("ownThisBusiness")}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {t("claimDescription")}
      </p>
      <Link
        href={`/claim?entityId=${entity.id}`}
        className="inline-block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium mb-3"
      >
        {t("claimThisEntity")}
      </Link>
    </div>
  );
}

