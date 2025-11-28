"use client";

import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

interface ProfileImageSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function ProfileImageSection({ entity, config }: ProfileImageSectionProps) {
  const t = useTranslations("entity");
  
  const images = entity.images as Record<string, string> | null;
  const heroImage = images?.hero;
  
  if (!heroImage) {
    return null;
  }

  const titleKey = config?.titleKey || "photo";
  const imageHeight = config?.settings?.imageHeight || "500px";
  const objectFit = config?.settings?.objectFit || "cover";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t(titleKey)}
      </h2>
      <img
        src={heroImage}
        alt={entity.name}
        className="w-full rounded-lg"
        style={{ 
          height: imageHeight, 
          objectFit: objectFit 
        }}
      />
    </div>
  );
}

