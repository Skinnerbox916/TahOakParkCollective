"use client";

import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

interface DescriptionSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function DescriptionSection({ entity, config }: DescriptionSectionProps) {
  const t = useTranslations("entity");
  
  if (!entity.description) {
    return null;
  }

  const titleKey = config?.titleKey || "about";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        {t(titleKey)}
      </h2>
      <p className="text-gray-700 whitespace-pre-line">
        {entity.description}
      </p>
    </div>
  );
}

