"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";

// Loading component for map
function MapLoading() {
  const t = useTranslations("entity");
  return (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">{t("loadingMap")}</p>
    </div>
  );
}

// Dynamically import map component to avoid SSR issues
const EntityMap = dynamic(
  () => import("@/components/search/EntityMap").then((mod) => mod.EntityMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

interface MapSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function MapSection({ entity, config }: MapSectionProps) {
  const t = useTranslations("entity");
  
  const hasLocation = entity.latitude && entity.longitude;
  
  if (!hasLocation) {
    return null;
  }

  const mapCenter = [entity.latitude!, entity.longitude!] as [number, number];
  const titleKey = config?.titleKey || "location";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t(titleKey)}
      </h2>
      <EntityMap
        entities={[entity]}
        center={mapCenter}
        zoom={15}
      />
    </div>
  );
}

