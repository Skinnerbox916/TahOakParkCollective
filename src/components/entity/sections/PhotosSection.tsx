"use client";

import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

interface PhotosSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function PhotosSection({ entity, config }: PhotosSectionProps) {
  const t = useTranslations("entity");
  
  const images = entity.images as Record<string, string> | null;
  
  if (!images || typeof images !== 'object') {
    return null;
  }

  const showHero = config?.settings?.showHero !== false && images.hero;
  const showLogo = config?.settings?.showLogo !== false && images.logo;
  
  // Don't render if nothing to show
  if (!showHero && !showLogo) {
    return null;
  }

  const titleKey = config?.titleKey || "photos";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t(titleKey)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showHero && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{t("coverImage")}</p>
            <img
              src={images.hero}
              alt={`${entity.name} - Cover`}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        {showLogo && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{t("logo")}</p>
            <img
              src={images.logo}
              alt={`${entity.name} - Logo`}
              className="w-full h-48 object-contain bg-gray-50 rounded-lg p-4"
            />
          </div>
        )}
      </div>
    </div>
  );
}

