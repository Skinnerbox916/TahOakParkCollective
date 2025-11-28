"use client";

import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";
import { SocialMediaLinks } from "@/components/entity/SocialMediaLinks";

interface SocialMediaSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function SocialMediaSection({ entity, config }: SocialMediaSectionProps) {
  if (!entity.socialMedia) {
    return null;
  }

  return (
    <SocialMediaLinks
      socialMedia={entity.socialMedia as Record<string, string>}
    />
  );
}

