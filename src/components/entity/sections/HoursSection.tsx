"use client";

import type { EntityWithRelations } from "@/types";
import type { SectionConfig } from "@/lib/entityDisplayConfig";
import { HoursDisplay } from "@/components/entity/HoursDisplay";

interface HoursSectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

export function HoursSection({ entity, config }: HoursSectionProps) {
  if (!entity.hours) {
    return null;
  }

  return (
    <HoursDisplay hours={entity.hours as Record<string, any>} />
  );
}

