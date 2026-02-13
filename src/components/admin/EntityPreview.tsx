"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import { getTranslatedField } from "@/lib/translations";
import type { EntityType, TagCategory } from "@/lib/prismaEnums";
import { TagBadge } from "@/components/tags/TagBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BusinessHoursInput } from "@/components/form/BusinessHoursInput";
import { ENTITY_TYPES } from "@/lib/constants";
import type { BusinessHours, Category, ApiResponse } from "@/types";
import { formatPhoneForDisplay } from "@/lib/phone";

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
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  entityType?: string;
  hours?: BusinessHours | null;
  socialMedia?: Record<string, string> | null;
  nameTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  categorySlugs?: string[];
  tagSlugs?: string[];
  displaySettings?: {
    address?: boolean;
    phone?: boolean;
    website?: boolean;
    hours?: boolean;
    socialMedia?: boolean;
    location?: boolean;
  };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface EntityPreviewProps {
  entityData: EntityData;
  resolvedCategories: ResolvedCategory[];
  resolvedTags: ResolvedTag[];
  approvalId?: string;
  entityId?: string;
  mode?: "approval" | "admin" | "owner";
  editable?: boolean;
  onDataUpdated?: (updatedData: EntityData, resolvedCategories: ResolvedCategory[], resolvedTags: ResolvedTag[]) => void;
}

// Social media platforms supported
const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "yelp", "tiktok", "youtube", "threads"] as const;

/**
 * Format hours for display
 */
function formatHoursDisplay(hours: BusinessHours | null) {
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
    const isClosed = dayHours?.closed ?? false;
    if (!dayHours || isClosed) {
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
 * Supports inline editing when editable=true.
 */
export function EntityPreview({ 
  entityData, 
  resolvedCategories, 
  resolvedTags,
  approvalId,
  entityId,
  mode = "approval",
  editable = false,
  onDataUpdated,
}: EntityPreviewProps) {
  const locale = useLocale();
  const t = useTranslations("entity");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("admin.approvals.detail");
  const tEntityForm = useTranslations("admin.entityForm");
  const entityTypeLabels = useEntityTypeLabels();
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<EntityData>(entityData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Field enable/disable toggles for optional fields
  // Initialize from displaySettings metadata or fallback to checking if values exist
  const [fieldEnabled, setFieldEnabled] = useState({
    address: entityData.displaySettings?.address ?? !!entityData.address,
    phone: entityData.displaySettings?.phone ?? !!entityData.phone,
    website: entityData.displaySettings?.website ?? !!entityData.website,
    hours: entityData.displaySettings?.hours ?? !!entityData.hours,
    socialMedia: entityData.displaySettings?.socialMedia ?? (!!entityData.socialMedia && Object.keys(entityData.socialMedia).length > 0),
    location: entityData.displaySettings?.location ?? !!(entityData.latitude && entityData.longitude),
  });
  
  // Selector options
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Translation tab state
  const [nameTranslationLocale, setNameTranslationLocale] = useState<"en" | "es">("en");
  const [descTranslationLocale, setDescTranslationLocale] = useState<"en" | "es">("en");
  
  // Store original entityData to restore values when toggling fields back on
  const [originalEntityData] = useState<EntityData>(entityData);
  
  // Reset edited data when entityData changes
  useEffect(() => {
    setEditedData(entityData);
    setFieldEnabled({
      address: entityData.displaySettings?.address ?? !!entityData.address,
      phone: entityData.displaySettings?.phone ?? !!entityData.phone,
      website: entityData.displaySettings?.website ?? !!entityData.website,
      hours: entityData.displaySettings?.hours ?? !!entityData.hours,
      socialMedia: entityData.displaySettings?.socialMedia ?? (!!entityData.socialMedia && Object.keys(entityData.socialMedia).length > 0),
      location: entityData.displaySettings?.location ?? !!(entityData.latitude && entityData.longitude),
    });
  }, [entityData]);
  
  // Restore original values when toggling fields back on
  const toggleField = (field: keyof typeof fieldEnabled, enabled: boolean) => {
    setFieldEnabled(prev => ({ ...prev, [field]: enabled }));
    if (enabled && !editedData[field as keyof EntityData]) {
      // Restore original value if current value is empty
      const originalValue = originalEntityData[field as keyof EntityData];
      if (originalValue) {
        updateField(field as keyof EntityData, originalValue);
      }
    }
  };
  
  // Load categories and tags when entering edit mode
  useEffect(() => {
    if (isEditing && allCategories.length === 0) {
      loadOptions();
    }
  }, [isEditing]);
  
  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [catResponse, tagResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      
      const catData: ApiResponse<Category[]> = await catResponse.json();
      const tagData: ApiResponse<Tag[]> = await tagResponse.json();
      
      if (catData.success && catData.data) {
        setAllCategories(catData.data);
      }
      if (tagData.success && tagData.data) {
        setAllTags(tagData.data);
      }
    } catch (err) {
      console.error("Error loading options:", err);
    }
    setLoadingOptions(false);
  };
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    const dataToSave: EntityData = { 
      ...editedData,
      displaySettings: fieldEnabled,
    };
    
    try {
      let response: Response;
      if (mode === "approval") {
        if (!approvalId) throw new Error("Missing approvalId");
        response = await fetch(`/api/admin/approvals/${approvalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposedEntityData: dataToSave }),
        });
      } else {
        if (!entityId) throw new Error("Missing entityId");
        response = await fetch(`/api/entities/${entityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
      }
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const updatedData = mode === "approval" ? data.data.proposedEntityData || data.data : data.data;
        onDataUpdated?.(updatedData, resolvedCategories, resolvedTags);
        setIsEditing(false);
      } else {
        // If we have field-specific errors, show them in a user-friendly way
        if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          const errorMessages = Object.entries(data.fieldErrors)
            .map(([field, message]) => {
              // Translate i18n keys if they start with "validation."
              let translatedMessage = message as string;
              if (typeof message === 'string' && message.startsWith('validation.')) {
                const key = message.replace('validation.', '');
                translatedMessage = tEntityForm(`validation.${key}`) || message as string;
              }
              return `${field}: ${translatedMessage}`;
            })
            .join('; ');
          setError(errorMessages);
        } else {
          setError(data.error || "Failed to save changes");
        }
      }
    } catch (err) {
      setError("Failed to save changes");
    }
    
    setSaving(false);
  };
  
  const handleCancel = () => {
    setEditedData(entityData);
    setIsEditing(false);
    setError(null);
  };
  
  const updateField = <K extends keyof EntityData>(field: K, value: EntityData[K]) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleCategory = (slug: string) => {
    const currentSlugs = editedData.categorySlugs || [];
    if (currentSlugs.includes(slug)) {
      updateField("categorySlugs", currentSlugs.filter(s => s !== slug));
    } else {
      updateField("categorySlugs", [...currentSlugs, slug]);
    }
  };
  
  const toggleTag = (slug: string) => {
    const currentSlugs = editedData.tagSlugs || [];
    if (currentSlugs.includes(slug)) {
      updateField("tagSlugs", currentSlugs.filter(s => s !== slug));
    } else {
      updateField("tagSlugs", [...currentSlugs, slug]);
    }
  };
  
  const updateSocialMedia = (platform: string, url: string) => {
    const current = editedData.socialMedia || {};
    if (url.trim()) {
      updateField("socialMedia", { ...current, [platform]: url.trim() });
    } else {
      const { [platform]: _, ...rest } = current;
      updateField("socialMedia", Object.keys(rest).length > 0 ? rest : null);
    }
  };
  
  const groupedTags = groupTagsByCategory(resolvedTags);
  const tagOrder: TagCategory[] = ["IDENTITY", "FRIENDLINESS", "AMENITY"];
  
  // Use editedData when editing, entityData when viewing
  const displayData = isEditing ? editedData : entityData;
  const formattedHours = formatHoursDisplay(displayData.hours || null);
  const hasFormattedHours = !!(formattedHours && formattedHours.length > 0);
  const hasSocialMedia = !!(displayData.socialMedia && Object.keys(displayData.socialMedia).length > 0);
  
  // Get translated name and description for display
  const displayName = isEditing 
    ? (displayData.name || "") 
    : getTranslatedField(
        displayData.nameTranslations as Record<string, string> | null,
        locale,
        displayData.name || ""
      );
  
  const displayDescription = isEditing
    ? (displayData.description || "")
    : getTranslatedField(
        displayData.descriptionTranslations as Record<string, string> | null,
        locale,
        displayData.description || ""
      );

  return (
    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/50">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
          {isEditing ? tAdmin("editingEntityData") : tAdmin("previewTitle")}
        </div>
        {editable && (approvalId || entityId) && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? tCommon("saving") : tCommon("saveChanges")}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {tCommon("edit")}
              </Button>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label={tCommon("name")}
                value={editedData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
              />
              <Input
                label={tAdmin("slug")}
                value={editedData.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tEntityForm("fields.entityType")}</label>
                <select
                  value={editedData.entityType || "COMMERCE"}
                  onChange={(e) => updateField("entityType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ENTITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tEntityForm("fields.categories")}</label>
                {loadingOptions ? (
                  <p className="text-sm text-gray-500">{tCommon("loading")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => (
                      <label
                        key={cat.slug}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer transition-colors ${
                          (editedData.categorySlugs || []).includes(cat.slug)
                            ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(editedData.categorySlugs || []).includes(cat.slug)}
                          onChange={() => toggleCategory(cat.slug)}
                          className="sr-only"
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tEntityForm("fields.tags")}</label>
                {loadingOptions ? (
                  <p className="text-sm text-gray-500">{tCommon("loading")}</p>
                ) : (
                  <div className="space-y-3">
                    {(["IDENTITY", "FRIENDLINESS", "AMENITY"] as const).map((category) => {
                      const categoryTags = allTags.filter(t => t.category === category);
                      if (categoryTags.length === 0) return null;
                      return (
                        <div key={category}>
                          <p className="text-xs font-medium text-gray-500 mb-1">{category}</p>
                          <div className="flex flex-wrap gap-2">
                            {categoryTags.map((tag) => (
                              <label
                                key={tag.slug}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                  (editedData.tagSlugs || []).includes(tag.slug)
                                    ? "bg-green-100 border border-green-300 text-green-700"
                                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={(editedData.tagSlugs || []).includes(tag.slug)}
                                  onChange={() => toggleTag(tag.slug)}
                                  className="sr-only"
                                />
                                <span>{tag.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
              <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {displayName || tAdmin("unnamedEntity")}
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {displayData.entityType && (
                  <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded">
                    {entityTypeLabels[displayData.entityType as EntityType] || displayData.entityType}
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
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-2 p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("description")}
              </h3>
              {isEditing ? (
                <textarea
                  value={editedData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={tEntityForm("placeholders.description")}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-line">
                  {displayDescription || <span className="text-gray-400 italic">{tAdmin("noDescription")}</span>}
                </p>
              )}
            </div>

            {/* Translations */}
            {isEditing && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{tAdmin("nameTranslations")}</label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex border-b bg-gray-50">
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${nameTranslationLocale === "en" ? "bg-white border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500"}`}
                        onClick={() => setNameTranslationLocale("en")}
                      >
                        {tAdmin("languageEnglish")}
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${nameTranslationLocale === "es" ? "bg-white border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500"}`}
                        onClick={() => setNameTranslationLocale("es")}
                      >
                        {tAdmin("languageSpanish")}
                      </button>
                    </div>
                    <div className="p-3">
                      <Input
                        value={editedData.nameTranslations?.[nameTranslationLocale] || ""}
                        onChange={(e) => updateField("nameTranslations", {
                          ...editedData.nameTranslations,
                          [nameTranslationLocale]: e.target.value,
                        })}
                        placeholder={tAdmin("nameInLanguage", { language: nameTranslationLocale === "en" ? tAdmin("languageEnglish") : tAdmin("languageSpanish") })}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{tAdmin("descriptionTranslations")}</label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex border-b bg-gray-50">
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${descTranslationLocale === "en" ? "bg-white border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500"}`}
                        onClick={() => setDescTranslationLocale("en")}
                      >
                        {tAdmin("languageEnglish")}
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${descTranslationLocale === "es" ? "bg-white border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500"}`}
                        onClick={() => setDescTranslationLocale("es")}
                      >
                        {tAdmin("languageSpanish")}
                      </button>
                    </div>
                    <div className="p-3">
                      <textarea
                        value={editedData.descriptionTranslations?.[descTranslationLocale] || ""}
                        onChange={(e) => updateField("descriptionTranslations", {
                          ...editedData.descriptionTranslations,
                          [descTranslationLocale]: e.target.value,
                        })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={tAdmin("descriptionInLanguage", { language: descTranslationLocale === "en" ? tAdmin("languageEnglish") : tAdmin("languageSpanish") })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map placeholder / Coordinates */}
            {(displayData.latitude && displayData.longitude) && (fieldEnabled.location || isEditing) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("location")}
                  </h3>
                  {isEditing && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldEnabled.location}
                        onChange={(e) => toggleField("location", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                    </label>
                  )}
                </div>
                {fieldEnabled.location && (
                  <>
                    <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                      <div className="text-2xl mb-2">📍</div>
                      <p className="text-sm">
                        Map will be displayed here
                        <br />
                        <span className="text-xs text-gray-400">
                          {displayData.latitude?.toFixed(6)}, {displayData.longitude?.toFixed(6)}
                        </span>
                      </p>
                    </div>
                    {displayData.address && fieldEnabled.address && !isEditing && (
                      <p className="mt-2 text-gray-600 text-sm">
                        {displayData.address}
                      </p>
                    )}
                    {isEditing && (
                      <p className="mt-2 text-xs text-amber-600">
                        {tAdmin("coordinatesNote")}
                        {!displayData.address && (
                          <span className="block mt-1">
                            {tAdmin("coordinatesPreserved")}
                          </span>
                        )}
                      </p>
                    )}
                    {!isEditing && !displayData.address && displayData.latitude && displayData.longitude && (
                      <p className="mt-2 text-xs text-gray-500 italic">
                        {tAdmin("coordinatesPreserved")}
                      </p>
                    )}
                  </>
                )}
                {!fieldEnabled.location && isEditing && (
                  <p className="text-sm text-gray-500 italic">
                    {tAdmin("locationDisabled")}
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
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {tEntityForm("fields.address")}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldEnabled.address}
                          onChange={(e) => toggleField("address", e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                      </label>
                    </div>
                    <Input
                      value={editedData.address || ""}
                      onChange={(e) => updateField("address", e.target.value || null)}
                      placeholder={tEntityForm("placeholders.address")}
                      disabled={!fieldEnabled.address}
                      className={!fieldEnabled.address ? "opacity-50 bg-gray-100" : ""}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {tEntityForm("fields.phone")}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldEnabled.phone}
                          onChange={(e) => toggleField("phone", e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                      </label>
                    </div>
                    <Input
                      value={editedData.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder={tEntityForm("placeholders.phone")}
                      disabled={!fieldEnabled.phone}
                      className={!fieldEnabled.phone ? "opacity-50 bg-gray-100" : ""}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {tEntityForm("fields.website")}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldEnabled.website}
                          onChange={(e) => toggleField("website", e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                      </label>
                    </div>
                    <Input
                      type="url"
                      value={editedData.website || ""}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder={tEntityForm("placeholders.website")}
                      disabled={!fieldEnabled.website}
                      className={!fieldEnabled.website ? "opacity-50 bg-gray-100" : ""}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {displayData.address && fieldEnabled.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400">📍</span>
                      <span className="text-gray-700">{displayData.address}</span>
                    </div>
                  )}
                  {displayData.phone && fieldEnabled.phone && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400">📞</span>
                      <span className="text-gray-700">{formatPhoneForDisplay(displayData.phone)}</span>
                    </div>
                  )}
                  {displayData.website && fieldEnabled.website && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400">🌐</span>
                      <a
                        href={displayData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 break-all"
                      >
                        {displayData.website}
                      </a>
                    </div>
                  )}
                  {(!displayData.address || !fieldEnabled.address) && 
                   (!displayData.phone || !fieldEnabled.phone) && 
                   (!displayData.website || !fieldEnabled.website) && (
                    <p className="text-gray-500 italic">{tAdmin("noContactInfo")}</p>
                  )}
                </div>
              )}
            </div>

            {/* Hours */}
            {(isEditing || (fieldEnabled.hours && hasFormattedHours)) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("hours")}
                  </h3>
                  {isEditing && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldEnabled.hours}
                        onChange={(e) => toggleField("hours", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                    </label>
                  )}
                </div>
                {isEditing ? (
                  <div className={!fieldEnabled.hours ? "opacity-50" : ""}>
                    <BusinessHoursInput
                      value={(editedData.hours as BusinessHours) || {}}
                      onChange={(hours) => updateField("hours", hours)}
                      disabled={!fieldEnabled.hours}
                    />
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    {formattedHours?.map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-500">{label}</span>
                        <span className={value === "Closed" ? "text-gray-400" : "text-gray-700"}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Social Media */}
            {(isEditing || (fieldEnabled.socialMedia && hasSocialMedia)) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("socialMedia")}
                  </h3>
                  {isEditing && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldEnabled.socialMedia}
                        onChange={(e) => toggleField("socialMedia", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">{tAdmin("includeField")}</span>
                    </label>
                  )}
                </div>
                {isEditing ? (
                  <div className={`space-y-2 ${!fieldEnabled.socialMedia ? "opacity-50" : ""}`}>
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <Input
                        key={platform}
                        label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                        type="url"
                        value={editedData.socialMedia?.[platform] || ""}
                        onChange={(e) => updateSocialMedia(platform, e.target.value)}
                        placeholder={`https://${platform}.com/...`}
                        disabled={!fieldEnabled.socialMedia}
                        className={!fieldEnabled.socialMedia ? "opacity-50 bg-gray-100" : ""}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {Object.entries(displayData.socialMedia as Record<string, string>).map(([platform, url]) => (
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
                )}
              </div>
            )}

          </div>
        </div>

        {/* Translations notice (display mode only) */}
        {!isEditing && (displayData.nameTranslations || displayData.descriptionTranslations) && (
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>Translations available:</strong>{" "}
              {displayData.nameTranslations && "Name (Spanish)"}{" "}
              {displayData.nameTranslations && displayData.descriptionTranslations && " • "}
              {displayData.descriptionTranslations && "Description (Spanish)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
