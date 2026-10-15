"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

interface ReportSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function ReportSection({ entity, config }: ReportSectionProps) {
  const t = useTranslations("entity");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t("foundAnIssue")}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {t("reportDescription")}
      </p>
      <Link
        href={`/report?entityId=${entity.id}`}
        className="inline-block w-full text-center px-4 py-2 bg-error-50 text-error-700 border border-error-200 rounded-lg hover:bg-error-100 transition-colors text-sm font-medium"
      >
        {t("reportAnIssue")}
      </Link>
    </div>
  );
}

