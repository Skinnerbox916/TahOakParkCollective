"use client";

import { useTranslations } from "next-intl";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";
import { SocialMediaLinks } from "@/components/entity/SocialMediaLinks";

interface SocialMediaSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function SocialMediaSection({ entity, config }: SocialMediaSectionProps) {
  const t = useTranslations();

  if (!entity.socialMedia) {
    return null;
  }

  return (
    <SocialMediaLinks
      title={t("entity.socialMedia")}
      opensInNewTabText={t("common.opensInNewTab")}
      socialMedia={entity.socialMedia as Record<string, string>}
    />
  );
}

