/**
 * Entity Profile Sections
 * 
 * This module exports all section components and provides a registry
 * for config-driven rendering in EntityDetail.
 */

import type { ComponentType } from "react";
import type { EntityWithRelations } from "@/types";
import type { SectionConfig, SectionId } from "@/lib/entityDisplayConfig";

// Export individual sections
export { DescriptionSection } from "./DescriptionSection";
export { MapSection } from "./MapSection";
export { ProfileImageSection } from "./ProfileImageSection";
export { PhotosSection } from "./PhotosSection";
export { ContactSection } from "./ContactSection";
export { HoursSection } from "./HoursSection";
export { SocialMediaSection } from "./SocialMediaSection";
export { ClaimSection } from "./ClaimSection";
export { ReportSection } from "./ReportSection";

// Import for registry
import { DescriptionSection } from "./DescriptionSection";
import { MapSection } from "./MapSection";
import { ProfileImageSection } from "./ProfileImageSection";
import { PhotosSection } from "./PhotosSection";
import { ContactSection } from "./ContactSection";
import { HoursSection } from "./HoursSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { ClaimSection } from "./ClaimSection";
import { ReportSection } from "./ReportSection";

/**
 * Props that all section components receive
 */
export interface SectionProps {
  entity: EntityWithRelations;
  config?: SectionConfig;
}

/**
 * Registry mapping section IDs to their components.
 * Add new sections here when creating them.
 */
export const SECTION_COMPONENTS: Record<SectionId, ComponentType<SectionProps>> = {
  description: DescriptionSection,
  map: MapSection,
  profileImage: ProfileImageSection,
  photos: PhotosSection,
  contact: ContactSection,
  hours: HoursSection,
  socialMedia: SocialMediaSection,
  claim: ClaimSection,
  report: ReportSection,
};

/**
 * Get the component for a section ID.
 * Returns null if section ID is not registered.
 */
export function getSectionComponent(sectionId: SectionId): ComponentType<SectionProps> | null {
  return SECTION_COMPONENTS[sectionId] || null;
}

