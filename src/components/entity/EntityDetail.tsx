"use client";

import { useTranslations } from "next-intl";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import type { EntityType, TagCategory } from "@/lib/prismaEnums";
import { TagBadge } from "@/components/tags/TagBadge";
import { 
  getLayoutConfig, 
  shouldShowSection,
  getSectionConfig,
  type SectionId 
} from "@/lib/entityDisplayConfig";
import { SECTION_COMPONENTS } from "./sections";

interface EntityDetailProps {
  entity: EntityWithRelations;
}

/**
 * Entity Header Component
 * Renders the entity name, type badge, category badges, and tags.
 */
function EntityHeader({ entity }: { entity: EntityWithRelations }) {
  const entityTypeLabels = useEntityTypeLabels();
  
  // Group tags by category
  const groupedTags = (entity.tags as EntityTagWithTag[] || []).reduce((acc, entityTag) => {
    const category = entityTag.tag.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(entityTag);
    return acc;
  }, {} as Record<TagCategory, EntityTagWithTag[]>);

  const tagOrder: TagCategory[] = ["IDENTITY", "FRIENDLINESS", "AMENITY"];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {entity.name}
          </h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded">
              {entityTypeLabels[entity.entityType as EntityType]}
            </span>
            {entity.categories?.map((cat: any) => (
              <span key={cat.id} className="inline-block px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded">
                {cat.name}
              </span>
            ))}
          </div>
          
          {/* Tags */}
          {entity.tags && entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tagOrder.map(category => {
                if (!groupedTags[category]) return null;
                return groupedTags[category].map(et => (
                  <TagBadge 
                    key={et.id} 
                    name={et.tag.name} 
                    category={et.tag.category}
                    verified={et.verified}
                  />
                ));
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Section Renderer
 * Renders a section based on its ID and configuration.
 */
function Section({ 
  sectionId, 
  entity, 
  config 
}: { 
  sectionId: SectionId; 
  entity: EntityWithRelations; 
  config: ReturnType<typeof getLayoutConfig>;
}) {
  // Check if section should be shown
  if (!shouldShowSection(sectionId, config, entity)) {
    return null;
  }

  // Get the component for this section
  const Component = SECTION_COMPONENTS[sectionId];
  if (!Component) {
    console.warn(`No component registered for section: ${sectionId}`);
    return null;
  }

  // Get section-specific config
  const sectionConfig = getSectionConfig(sectionId, config);

  return <Component entity={entity} config={sectionConfig} />;
}

/**
 * EntityDetail Component
 * 
 * Renders the full entity profile page using a config-driven approach.
 * The layout and sections shown are determined by the entity's type.
 * 
 * @see src/lib/entityDisplayConfig.ts for layout configurations
 * @see src/components/entity/sections/ for section components
 */
export function EntityDetail({ entity }: EntityDetailProps) {
  // Get layout configuration based on entity type
  const config = getLayoutConfig(entity.entityType as EntityType, entity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header - always shown */}
      <EntityHeader entity={entity} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {config.mainSections.map(sectionId => (
            <Section 
              key={sectionId} 
              sectionId={sectionId} 
              entity={entity} 
              config={config} 
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {config.sidebarSections.map(sectionId => (
            <Section 
              key={sectionId} 
              sectionId={sectionId} 
              entity={entity} 
              config={config} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
