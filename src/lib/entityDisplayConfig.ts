/**
 * Entity Display Configuration
 * 
 * Defines how entity profiles are rendered based on entity type.
 * This is the foundation for entity type-aware profile customizations.
 * 
 * To add a new entity type configuration:
 * 1. Add a case to getLayoutConfig()
 * 2. Define mainSections, sidebarSections, and section-specific settings
 * 
 * To add a new section type:
 * 1. Add the section ID to SectionId type
 * 2. Create the section component in src/components/entity/sections/
 * 3. Register it in the SECTION_COMPONENTS map in sections/index.ts
 * 4. Use in any entity type config
 */

import type { EntityType } from "@/lib/prismaEnums";
import type { EntityWithRelations } from "@/types";

// ============================================================================
// Section Types
// ============================================================================

/**
 * All available section identifiers.
 * Add new sections here as they're created.
 */
export type SectionId =
  | 'description'
  | 'map'
  | 'profileImage'
  | 'photos'
  | 'contact'
  | 'hours'
  | 'socialMedia'
  | 'claim'
  | 'report';

/**
 * Configuration for individual sections.
 * Each section can have its own settings.
 */
export interface SectionConfig {
  /** Whether this section should be rendered */
  enabled: boolean;
  /** Translation key for section title (overrides default) */
  titleKey?: string;
  /** Section-specific settings */
  settings?: {
    /** For profileImage/photos: image height */
    imageHeight?: string;
    /** For profileImage/photos: object-fit style */
    objectFit?: 'cover' | 'contain';
    /** For photos: whether to show hero image (false if shown as profileImage) */
    showHero?: boolean;
    /** For photos: whether to show logo */
    showLogo?: boolean;
  };
}

// ============================================================================
// Layout Configuration
// ============================================================================

/**
 * Full layout configuration for an entity type.
 */
export interface EntityLayoutConfig {
  /** Sections to render in the main content area (left/top), in order */
  mainSections: SectionId[];
  /** Sections to render in the sidebar (right), in order */
  sidebarSections: SectionId[];
  /** Per-section configuration overrides */
  sections: Partial<Record<SectionId, SectionConfig>>;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default layout for most entity types (COMMERCE, etc.)
 * This matches the current EntityDetail behavior.
 */
const DEFAULT_LAYOUT: EntityLayoutConfig = {
  mainSections: ['description', 'map', 'photos'],
  sidebarSections: ['contact', 'hours', 'socialMedia', 'claim', 'report'],
  sections: {
    description: { enabled: true },
    map: { enabled: true },
    photos: { 
      enabled: true,
      settings: { showHero: true, showLogo: true }
    },
    contact: { enabled: true },
    hours: { enabled: true },
    socialMedia: { enabled: true },
    claim: { enabled: true },
    report: { enabled: true },
  },
};

/**
 * CIVIC layout (elected officials, government offices)
 * - Shows profile image instead of map when no location
 * - Hides hours section (not relevant for people/offices)
 */
const CIVIC_LAYOUT: EntityLayoutConfig = {
  mainSections: ['description', 'map', 'profileImage', 'photos'],
  sidebarSections: ['contact', 'socialMedia', 'claim', 'report'],
  sections: {
    description: { enabled: true },
    map: { enabled: true }, // Will only show if entity has location
    profileImage: { 
      enabled: true,
      titleKey: 'photo',
      settings: { 
        imageHeight: '500px',
        objectFit: 'cover'
      }
    },
    photos: { 
      enabled: true,
      // Don't show hero in photos if it's shown as profile image
      settings: { showHero: false, showLogo: true }
    },
    contact: { enabled: true },
    hours: { enabled: false }, // Not relevant for CIVIC entities
    socialMedia: { enabled: true },
    claim: { enabled: true },
    report: { enabled: true },
  },
};

/**
 * SERVICE_PROVIDER layout (freelancers, home-based services)
 * - Shows profile image instead of map when no location (common for home-based)
 * - Shows hours (if provided)
 */
const SERVICE_PROVIDER_LAYOUT: EntityLayoutConfig = {
  mainSections: ['description', 'map', 'profileImage', 'photos'],
  sidebarSections: ['contact', 'hours', 'socialMedia', 'claim', 'report'],
  sections: {
    description: { enabled: true },
    map: { enabled: true },
    profileImage: { 
      enabled: true,
      titleKey: 'photo',
      settings: { 
        imageHeight: '400px',
        objectFit: 'cover'
      }
    },
    photos: { 
      enabled: true,
      settings: { showHero: false, showLogo: true }
    },
    contact: { enabled: true },
    hours: { enabled: true },
    socialMedia: { enabled: true },
    claim: { enabled: true },
    report: { enabled: true },
  },
};

/**
 * PUBLIC_SPACE layout (parks, plazas, community centers)
 * - Always shows map (public spaces should have locations)
 * - No hours by default (parks are typically always open)
 */
const PUBLIC_SPACE_LAYOUT: EntityLayoutConfig = {
  mainSections: ['description', 'map', 'photos'],
  sidebarSections: ['contact', 'socialMedia', 'claim', 'report'],
  sections: {
    description: { enabled: true },
    map: { enabled: true },
    photos: { 
      enabled: true,
      settings: { showHero: true, showLogo: true }
    },
    contact: { enabled: true },
    hours: { enabled: false }, // Parks typically don't have hours
    socialMedia: { enabled: true },
    claim: { enabled: true },
    report: { enabled: true },
  },
};

/**
 * EVENT layout (recurring events)
 * - Shows map if there's a fixed location
 * - Shows profile image for events without fixed location
 */
const EVENT_LAYOUT: EntityLayoutConfig = {
  mainSections: ['description', 'map', 'profileImage', 'photos'],
  sidebarSections: ['contact', 'hours', 'socialMedia', 'claim', 'report'],
  sections: {
    description: { enabled: true },
    map: { enabled: true },
    profileImage: { 
      enabled: true,
      titleKey: 'eventImage',
      settings: { 
        imageHeight: '400px',
        objectFit: 'cover'
      }
    },
    photos: { 
      enabled: true,
      settings: { showHero: false, showLogo: true }
    },
    contact: { enabled: true },
    hours: { enabled: true }, // Event schedule/hours
    socialMedia: { enabled: true },
    claim: { enabled: true },
    report: { enabled: true },
  },
};

// ============================================================================
// Configuration Getter
// ============================================================================

/**
 * Get the layout configuration for an entity based on its type.
 * 
 * @param entityType - The entity's type
 * @param entity - The full entity (for conditional logic based on entity data)
 * @returns The layout configuration to use for rendering
 */
export function getLayoutConfig(
  entityType: EntityType,
  entity: EntityWithRelations
): EntityLayoutConfig {
  const hasLocation = entity.latitude && entity.longitude;
  const hasHeroImage = (entity.images as any)?.hero;
  
  // Get base config for entity type
  let config: EntityLayoutConfig;
  
  switch (entityType) {
    case 'CIVIC':
      config = CIVIC_LAYOUT;
      break;
    case 'SERVICE_PROVIDER':
      config = SERVICE_PROVIDER_LAYOUT;
      break;
    case 'PUBLIC_SPACE':
      config = PUBLIC_SPACE_LAYOUT;
      break;
    case 'EVENT':
      config = EVENT_LAYOUT;
      break;
    case 'COMMERCE':
    case 'ADVOCACY':
    case 'NON_PROFIT':
    default:
      config = DEFAULT_LAYOUT;
      break;
  }
  
  // Apply runtime adjustments based on entity data
  return applyRuntimeAdjustments(config, { hasLocation, hasHeroImage });
}

/**
 * Apply runtime adjustments to config based on entity data.
 * This handles conditional logic like "show profileImage only if no location".
 */
function applyRuntimeAdjustments(
  config: EntityLayoutConfig,
  context: { hasLocation: boolean; hasHeroImage: boolean }
): EntityLayoutConfig {
  const { hasLocation, hasHeroImage } = context;
  
  // Deep clone to avoid mutating the base config
  const adjusted: EntityLayoutConfig = {
    mainSections: [...config.mainSections],
    sidebarSections: [...config.sidebarSections],
    sections: JSON.parse(JSON.stringify(config.sections)),
  };
  
  // Map section: only show if entity has location
  if (adjusted.sections.map) {
    adjusted.sections.map.enabled = hasLocation;
  }
  
  // Profile image: only show if NO location AND has hero image
  if (adjusted.sections.profileImage) {
    adjusted.sections.profileImage.enabled = !hasLocation && hasHeroImage;
  }
  
  // Photos section: adjust hero visibility based on whether profileImage is shown
  if (adjusted.sections.photos?.settings) {
    const profileImageShown = !hasLocation && hasHeroImage && 
      config.sections.profileImage?.enabled;
    
    // If profile image is shown, don't duplicate hero in photos
    if (profileImageShown) {
      adjusted.sections.photos.settings.showHero = false;
    }
  }
  
  return adjusted;
}

/**
 * Check if a section should be rendered.
 * Handles both explicit config and data-based visibility.
 */
export function shouldShowSection(
  sectionId: SectionId,
  config: EntityLayoutConfig,
  entity: EntityWithRelations
): boolean {
  const sectionConfig = config.sections[sectionId];
  
  // If section is explicitly disabled, don't show
  if (sectionConfig?.enabled === false) {
    return false;
  }
  
  // Additional data-based checks
  switch (sectionId) {
    case 'description':
      return !!entity.description;
    case 'hours':
      return !!entity.hours;
    case 'socialMedia':
      return !!entity.socialMedia;
    case 'photos':
      const images = entity.images as any;
      const showHero = sectionConfig?.settings?.showHero !== false && images?.hero;
      const showLogo = sectionConfig?.settings?.showLogo !== false && images?.logo;
      return showHero || showLogo;
    case 'profileImage':
      return !!(entity.images as any)?.hero;
    default:
      return true;
  }
}

/**
 * Get section-specific configuration with defaults.
 */
export function getSectionConfig(
  sectionId: SectionId,
  config: EntityLayoutConfig
): SectionConfig {
  return config.sections[sectionId] || { enabled: true };
}

