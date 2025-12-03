"use client";

import { useTranslations } from "next-intl";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import type { EntityType, TagCategory } from "@/lib/prismaEnums";
import { TagBadge } from "@/components/tags/TagBadge";
import { Card } from "@/components/ui/Card";

/**
 * Resolved category from the API
 */
interface ResolvedCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Resolved tag from the API
 */
interface ResolvedTag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

/**
 * Entity data from the approval record
 */
interface EntityData {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number | null;
  longitude?: number | null;
  entityType?: string;
  hours?: Record<string, { open: string | null; close: string | null; closed: boolean }> | null;
  socialMedia?: Record<string, string> | null;
  nameTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  categorySlugs?: string[];
  tagSlugs?: string[];
}

interface EntityPreviewProps {
  entityData: EntityData;
  resolvedCategories: ResolvedCategory[];
  resolvedTags: ResolvedTag[];
}

/**
 * Format hours for display
 */
function formatHoursDisplay(hours: Record<string, { open: string | null; close: string | null; closed: boolean }> | null) {
  if (!hours) return null;
  
  const days = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ];

  return days.map(({ key, label }) => {
    const dayHours = hours[key];
    if (!dayHours || dayHours.closed) {
      return { label, value: "Closed" };
    }
    return { label, value: `${dayHours.open || "?"} - ${dayHours.close || "?"}` };
  });
}

/**
 * Group tags by category
 */
function groupTagsByCategory(tags: ResolvedTag[]): Record<string, ResolvedTag[]> {
  return tags.reduce((acc, tag) => {
    const category = tag.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, ResolvedTag[]>);
}

/**
 * EntityPreview Component
 * 
 * Renders a preview of an entity from approval data.
 * Mimics the actual entity profile layout so admins can see
 * exactly what the entity will look like when approved.
 */
export function EntityPreview({ entityData, resolvedCategories, resolvedTags }: EntityPreviewProps) {
  const t = useTranslations("entity");
  const entityTypeLabels = useEntityTypeLabels();
  
  const groupedTags = groupTagsByCategory(resolvedTags);
  const tagOrder: TagCategory[] = ["IDENTITY", "FRIENDLINESS", "AMENITY"];
  const formattedHours = formatHoursDisplay(entityData.hours || null);

  return (
    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/50">
      <div className="text-xs text-indigo-600 font-medium mb-4 uppercase tracking-wide">
        Preview - How the profile will appear
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {entityData.name || "Unnamed Entity"}
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {entityData.entityType && (
              <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded">
                {entityTypeLabels[entityData.entityType as EntityType] || entityData.entityType}
              </span>
            )}
            {resolvedCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-block px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>
          
          {/* Tags */}
          {resolvedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tagOrder.map((category) => {
                const categoryTags = groupedTags[category];
                if (!categoryTags) return null;
                return categoryTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    category={tag.category as TagCategory}
                    verified={true}
                  />
                ));
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-2 p-6 space-y-6">
            {/* Description */}
            {entityData.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("description")}
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {entityData.description}
                </p>
              </div>
            )}

            {/* Map placeholder */}
            {entityData.latitude && entityData.longitude && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("location")}
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">📍</div>
                  <p className="text-sm">
                    Map will be displayed here
                    <br />
                    <span className="text-xs text-gray-400">
                      {entityData.latitude.toFixed(6)}, {entityData.longitude.toFixed(6)}
                    </span>
                  </p>
                </div>
                {entityData.address && (
                  <p className="mt-2 text-gray-600 text-sm">
                    {entityData.address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 bg-gray-50 p-6 space-y-6 border-l border-gray-200">
            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t("contact")}
              </h3>
              <div className="space-y-2 text-sm">
                {entityData.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">📍</span>
                    <span className="text-gray-700">{entityData.address}</span>
                  </div>
                )}
                {entityData.phone && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">📞</span>
                    <span className="text-gray-700">{entityData.phone}</span>
                  </div>
                )}
                {entityData.website && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">🌐</span>
                    <a
                      href={entityData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 break-all"
                    >
                      {entityData.website}
                    </a>
                  </div>
                )}
                {!entityData.address && !entityData.phone && !entityData.website && (
                  <p className="text-gray-500 italic">No contact information</p>
                )}
              </div>
            </div>

            {/* Hours */}
            {formattedHours && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("hours")}
                </h3>
                <div className="space-y-1 text-sm">
                  {formattedHours.map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className={value === "Closed" ? "text-gray-400" : "text-gray-700"}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media */}
            {entityData.socialMedia && Object.keys(entityData.socialMedia).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("socialMedia")}
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(entityData.socialMedia).map(([platform, url]) => (
                    <div key={platform} className="flex items-center gap-2">
                      <span className="text-gray-500 capitalize">{platform}:</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 truncate"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Translations notice */}
        {(entityData.nameTranslations || entityData.descriptionTranslations) && (
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>Translations available:</strong>{" "}
              {entityData.nameTranslations && "Name (Spanish)"}{" "}
              {entityData.nameTranslations && entityData.descriptionTranslations && " • "}
              {entityData.descriptionTranslations && "Description (Spanish)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



