"use client";

import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";
import { formatPhoneNumber } from "@/lib/utils";

interface ContactSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function ContactSection({ entity, config }: ContactSectionProps) {
  const t = useTranslations("entity");

  const titleKey = config?.titleKey || "contact";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t(titleKey)}
      </h2>
      <div className="space-y-3">
        {entity.address && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("address")}
            </p>
            <p className="text-gray-900">{entity.address}</p>
          </div>
        )}
        {entity.phone && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("phone")}
            </p>
            <a
              href={`tel:${entity.phone}`}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {formatPhoneNumber(entity.phone)}
            </a>
          </div>
        )}
        {entity.website && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("website")}
            </p>
            <a
              href={entity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 break-all"
            >
              {entity.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

