/**
 * Entity Form Configuration
 * 
 * Defines which form sections and fields are shown based on entity type.
 * Parallel to entityDisplayConfig.ts but for form input rather than display.
 * 
 * To add a new section:
 * 1. Add the section ID to FormSectionId type
 * 2. Add default config in DEFAULT_SECTION_CONFIGS
 * 3. Add any entity-type-specific overrides in ENTITY_TYPE_OVERRIDES
 */

import type { EntityType } from "@/lib/prismaEnums";

// ============================================================================
// Section Types
// ============================================================================

/**
 * All available form section identifiers.
 */
export type FormSectionId = 
  | 'about'
  | 'locationContact'
  | 'hours'
  | 'onlinePresence'
  | 'media'
  | 'tags';

/**
 * Configuration for a form section.
 */
export interface FormSectionConfig {
  /** Whether this section is enabled for the entity type */
  enabled: boolean;
  /** Translation key for section title */
  titleKey: string;
  /** Translation key for section description/hint (optional) */
  descriptionKey?: string;
}

/**
 * Social media platforms that can be shown in the form.
 */
export type SocialPlatform = 
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'yelp'
  | 'tiktok'
  | 'youtube'
  | 'threads';

/**
 * Full form configuration for an entity type.
 */
export interface EntityFormConfig {
  /** Configuration for each section */
  sections: Record<FormSectionId, FormSectionConfig>;
  /** Which social media platforms to show */
  socialPlatforms: SocialPlatform[];
  /** Field-level hints per entity type */
  fieldHints?: {
    address?: string;
    hours?: string;
  };
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_SOCIAL_PLATFORMS: SocialPlatform[] = [
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
  'threads',
];

const BUSINESS_SOCIAL_PLATFORMS: SocialPlatform[] = [
  ...DEFAULT_SOCIAL_PLATFORMS,
  'yelp',
];

/**
 * Default section configurations (used as base for all entity types)
 * 
 * titleKey: Simple key suffix used with t(`sections.${titleKey}`)
 * descriptionKey: Simple key suffix used with t(`sections.${descriptionKey}`)
 */
const DEFAULT_SECTION_CONFIGS: Record<FormSectionId, FormSectionConfig> = {
  about: {
    enabled: true,
    titleKey: 'about',
  },
  locationContact: {
    enabled: true,
    titleKey: 'locationContact',
  },
  hours: {
    enabled: true,
    titleKey: 'hours',
  },
  onlinePresence: {
    enabled: true,
    titleKey: 'onlinePresence',
  },
  media: {
    enabled: true,
    titleKey: 'media',
  },
  tags: {
    enabled: true,
    titleKey: 'tags',
    descriptionKey: 'tagsDescription',
  },
};

// ============================================================================
// Entity Type Overrides
// ============================================================================

/**
 * Entity-type-specific overrides for section configs.
 * Only include sections that differ from defaults.
 */
const ENTITY_TYPE_OVERRIDES: Record<EntityType, {
  sections?: Partial<Record<FormSectionId, Partial<FormSectionConfig>>>;
  socialPlatforms?: SocialPlatform[];
  fieldHints?: EntityFormConfig['fieldHints'];
}> = {
  COMMERCE: {
    socialPlatforms: BUSINESS_SOCIAL_PLATFORMS,
    fieldHints: {
      address: 'commerce.address',
    },
  },
  CIVIC: {
    sections: {
      hours: { enabled: false },
    },
    socialPlatforms: DEFAULT_SOCIAL_PLATFORMS,
    fieldHints: {
      address: 'civic.address',
    },
  },
  PUBLIC_SPACE: {
    sections: {
      hours: { enabled: false },
    },
    socialPlatforms: DEFAULT_SOCIAL_PLATFORMS,
    fieldHints: {
      address: 'publicSpace.address',
    },
  },
  NON_PROFIT: {
    socialPlatforms: DEFAULT_SOCIAL_PLATFORMS,
  },
  EVENT: {
    sections: {
      hours: {
        enabled: true,
        titleKey: 'hoursEvent',
        descriptionKey: 'hoursEventDescription',
      },
    },
    socialPlatforms: DEFAULT_SOCIAL_PLATFORMS,
    fieldHints: {
      address: 'event.address',
      hours: 'event.hours',
    },
  },
  SERVICE_PROVIDER: {
    sections: {
      hours: {
        enabled: true,
        titleKey: 'hoursServiceProvider',
        descriptionKey: 'hoursServiceProviderDescription',
      },
    },
    socialPlatforms: BUSINESS_SOCIAL_PLATFORMS,
    fieldHints: {
      address: 'serviceProvider.address',
      hours: 'serviceProvider.hours',
    },
  },
};

// ============================================================================
// Configuration Getter
// ============================================================================

/**
 * Get the form configuration for an entity type.
 * Merges default configs with entity-type-specific overrides.
 * 
 * @param entityType - The entity's type
 * @returns The full form configuration
 */
export function getFormConfig(entityType: EntityType): EntityFormConfig {
  const overrides = ENTITY_TYPE_OVERRIDES[entityType] || {};
  
  // Merge section configs
  const sections = { ...DEFAULT_SECTION_CONFIGS };
  if (overrides.sections) {
    for (const [sectionId, sectionOverride] of Object.entries(overrides.sections)) {
      const id = sectionId as FormSectionId;
      sections[id] = { ...sections[id], ...sectionOverride };
    }
  }
  
  return {
    sections,
    socialPlatforms: overrides.socialPlatforms || DEFAULT_SOCIAL_PLATFORMS,
    fieldHints: overrides.fieldHints,
  };
}

/**
 * Check if a section should be shown for the given entity type.
 */
export function isSectionEnabled(
  sectionId: FormSectionId,
  entityType: EntityType
): boolean {
  const config = getFormConfig(entityType);
  return config.sections[sectionId]?.enabled ?? true;
}

/**
 * Get the section config for a specific section and entity type.
 */
export function getSectionConfig(
  sectionId: FormSectionId,
  entityType: EntityType
): FormSectionConfig {
  const config = getFormConfig(entityType);
  return config.sections[sectionId];
}
