"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { EntityWithRelations, ApiResponse, Category, EntityTagWithTag, SocialMediaLinks, BusinessHours } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormSection } from "@/components/ui/FormSection";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "@/lib/constants";
import type { EntityType, EntityStatus } from "@/lib/prismaEnums";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { TagSelector } from "@/components/tags/TagSelector";
import { ImageManager } from "@/components/images/ImageManager";
import { BusinessHoursInput } from "@/components/form/BusinessHoursInput";
import { getFormConfig, type SocialPlatform } from "@/lib/entityFormConfig";
import { formatPhoneNumber, normalizeUrl } from "@/lib/utils";

interface EntityFormProps {
  entity?: EntityWithRelations;
  onSuccess?: () => void;
  onEntityUpdate?: (entity: EntityWithRelations) => void;
  adminMode?: boolean;
}

// Social media platform labels and placeholders
const SOCIAL_PLATFORM_CONFIG: Record<SocialPlatform, { label: string; placeholder: string }> = {
  facebook: { label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  instagram: { label: "Instagram", placeholder: "https://instagram.com/yourpage" },
  twitter: { label: "Twitter", placeholder: "https://twitter.com/yourpage" },
  linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/company/yourpage" },
  yelp: { label: "Yelp", placeholder: "https://yelp.com/biz/yourpage" },
  tiktok: { label: "TikTok", placeholder: "https://tiktok.com/@yourpage" },
  youtube: { label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  threads: { label: "Threads", placeholder: "https://threads.net/@yourpage" },
};

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

export function EntityForm({ entity, onSuccess, onEntityUpdate, adminMode = false }: EntityFormProps) {
  const router = useRouter();
  const t = useTranslations(adminMode ? "admin.entityForm" : "portal.form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("COMMERCE");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [hours, setHours] = useState<BusinessHours>({});
  const [status, setStatus] = useState<EntityStatus>(ENTITY_STATUS.ACTIVE);
  const [ownerId, setOwnerId] = useState("");
  
  // Social media state
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    yelp: "",
    tiktok: "",
    youtube: "",
    threads: "",
  });

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Section expansion state (for controlled sections that need auto-expand on error)
  const [locationContactExpanded, setLocationContactExpanded] = useState(false);
  const [onlinePresenceExpanded, setOnlinePresenceExpanded] = useState(false);

  // Refs for scrolling to sections on error
  const locationContactRef = useRef<HTMLDivElement>(null);
  const onlinePresenceRef = useRef<HTMLDivElement>(null);

  // Get form configuration based on entity type
  const formConfig = useMemo(() => getFormConfig(entityType), [entityType]);

  // Load categories and populate form if editing
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/categories");
        const data: ApiResponse<Category[]> = await response.json();
        if (response.ok && data.success) {
          setCategories(data.data || []);
        }

        // Load users if in admin mode
        if (adminMode) {
          const usersResponse = await fetch("/api/admin/users");
          const usersData: ApiResponse<User[]> = await usersResponse.json();
          if (usersResponse.ok && usersData.success) {
            setUsers(usersData.data || []);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    loadData();

    // Populate form if editing
    if (entity) {
      setName(entity.name || "");
      setDescription(entity.description || "");
      setAddress(entity.address || "");
      setPhone(entity.phone || "");
      setWebsite(entity.website || "");
      // Extract first category from categories array (many-to-many relationship)
      const firstCategory = entity.categories && Array.isArray(entity.categories) && entity.categories.length > 0
        ? entity.categories[0].id
        : "";
      setCategoryId(firstCategory);
      setEntityType(entity.entityType || "COMMERCE");
      if (adminMode) {
        setStatus(entity.status || ENTITY_STATUS.ACTIVE);
        setOwnerId(entity.ownerId || "");
      }
      // Load hours
      if (entity.hours && typeof entity.hours === 'object') {
        setHours(entity.hours as BusinessHours);
      }
      // Load social media
      if (entity.socialMedia && typeof entity.socialMedia === 'object') {
        const social = entity.socialMedia as SocialMediaLinks;
        setSocialMedia({
          facebook: social.facebook || "",
          instagram: social.instagram || "",
          twitter: social.twitter || "",
          linkedin: social.linkedin || "",
          yelp: social.yelp || "",
          tiktok: social.tiktok || "",
          youtube: social.youtube || "",
          threads: social.threads || "",
        });
      }
      // Load tags
      if (entity.tags) {
        const tagIds = (entity.tags as EntityTagWithTag[]).map(et => et.tag.id);
        setSelectedTagIds(tagIds);
      }
      // Initialize section expansion for entities with data
      const hasLocationData = !!(entity.address || entity.phone || entity.website);
      setLocationContactExpanded(hasLocationData);
      const socialData = entity.socialMedia as SocialMediaLinks | undefined;
      const hasOnlineData = socialData && Object.values(socialData).some(v => v && v.trim());
      setOnlinePresenceExpanded(!!hasOnlineData);
    }
  }, [entity]);

  // Filter categories by entity type
  useEffect(() => {
    const filtered = categories.filter(cat => 
      cat.entityTypes && cat.entityTypes.includes(entityType)
    );
    setFilteredCategories(filtered);
    
    // Reset category if current selection is not valid for new entity type
    if (categoryId) {
      const currentCategory = categories.find(c => c.id === categoryId);
      if (currentCategory && (!currentCategory.entityTypes || !currentCategory.entityTypes.includes(entityType))) {
        setCategoryId("");
      }
    }
  }, [entityType, categories, categoryId]);

  // Section data checks for completion indicators
  const hasAboutData = !!description.trim();
  const hasLocationContactData = !!(address.trim() || phone.trim() || website.trim());
  const hasHoursData = Object.keys(hours).length > 0;
  const hasOnlinePresenceData = Object.values(socialMedia).some(v => v && v.trim());
  const hasMediaData = entity?.images && Object.keys(entity.images as object).length > 0;
  const hasTagsData = selectedTagIds.length > 0;

  const validateForm = (): { error: string; section?: string } | null => {
    // Clear previous field errors
    setFieldErrors({});

    if (!name.trim()) {
      return { error: t("validation.nameRequired") };
    }

    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        setFieldErrors(prev => ({ ...prev, website: t("validation.invalidWebsite") }));
        return { error: t("validation.invalidWebsite"), section: "locationContact" };
      }
    }

    // Validate social media URLs
    for (const platform of formConfig.socialPlatforms) {
      const url = socialMedia[platform];
      if (url && url.trim()) {
        try {
          new URL(url);
        } catch {
          const errorMsg = t("validation.invalidSocialUrl", { platform });
          setFieldErrors(prev => ({ ...prev, [platform]: errorMsg }));
          return { error: errorMsg, section: "onlinePresence" };
        }
      }
    }

    return null;
  };

  // Handle phone number formatting on blur
  const handlePhoneBlur = () => {
    const formatted = formatPhoneNumber(phone);
    if (formatted !== phone) {
      setPhone(formatted);
    }
  };

  // Handle website URL normalization and validation on blur
  const handleWebsiteBlur = () => {
    const normalized = normalizeUrl(website);
    if (normalized !== website) {
      setWebsite(normalized);
    }

    // Validate and show inline error
    if (normalized) {
      try {
        new URL(normalized);
        setFieldErrors(prev => {
          const { website: _, ...rest } = prev;
          return rest;
        });
      } catch {
        setFieldErrors(prev => ({ ...prev, website: t("validation.invalidWebsite") }));
      }
    } else {
      // Clear error if empty (field is optional)
      setFieldErrors(prev => {
        const { website: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle social media URL normalization and validation on blur
  const handleSocialMediaBlur = (platform: SocialPlatform) => {
    const value = socialMedia[platform];
    if (!value) return;

    const normalized = normalizeUrl(value);
    if (normalized !== value) {
      setSocialMedia(prev => ({ ...prev, [platform]: normalized }));
    }

    // Validate and show inline error
    if (normalized) {
      try {
        new URL(normalized);
        setFieldErrors(prev => {
          const { [platform]: _, ...rest } = prev;
          return rest;
        });
      } catch {
        setFieldErrors(prev => ({ ...prev, [platform]: t("validation.invalidSocialUrl", { platform }) }));
      }
    } else {
      setFieldErrors(prev => {
        const { [platform]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleTagChange = async (newTagIds: string[]) => {
    // For new entities, just update local state (tags will be saved with entity creation)
    if (!entity?.id) {
      setSelectedTagIds(newTagIds);
      return;
    }

    // For existing entities, make API calls to add/remove tags
    setTagLoading(true);
    const oldTagIds = selectedTagIds;
    
    // Find added and removed tags
    const added = newTagIds.filter(id => !oldTagIds.includes(id));
    const removed = oldTagIds.filter(id => !newTagIds.includes(id));

    try {
      // Add new tags
      for (const tagId of added) {
        const res = await fetch(`/api/entities/${entity.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add tag");
        }
      }

      // Remove tags
      for (const tagId of removed) {
        const res = await fetch(`/api/entities/${entity.id}/tags?tagId=${tagId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to remove tag");
        }
      }

      setSelectedTagIds(newTagIds);
    } catch (err) {
      console.error("Error updating tags:", err);
      setError(err instanceof Error ? err.message : "Failed to update tags");
    } finally {
      setTagLoading(false);
    }
  };

  // Helper function to clean social media links - remove empty values
  const cleanSocialMedia = (social: SocialMediaLinks): SocialMediaLinks | undefined => {
    const cleaned: SocialMediaLinks = {};
    
    for (const platform of formConfig.socialPlatforms) {
      if (social[platform] && social[platform]?.trim()) {
        cleaned[platform] = social[platform]?.trim();
      }
    }
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };

  // Helper function to clean hours - remove days with no data
  const cleanHours = (h: BusinessHours): BusinessHours | undefined => {
    const cleaned: BusinessHours = {};
    
    for (const [day, dayHours] of Object.entries(h)) {
      if (dayHours && (dayHours.closed || (dayHours.open && dayHours.close))) {
        cleaned[day] = dayHours;
      }
    }
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationResult = validateForm();
    if (validationResult) {
      setError(validationResult.error);
      
      // Auto-expand section with error and scroll to it
      if (validationResult.section === "locationContact") {
        setLocationContactExpanded(true);
        setTimeout(() => {
          locationContactRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      } else if (validationResult.section === "onlinePresence") {
        setOnlinePresenceExpanded(true);
        setTimeout(() => {
          onlinePresenceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      return;
    }

    setLoading(true);

    try {
      const cleanedSocialMedia = cleanSocialMedia(socialMedia);
      const cleanedHours = formConfig.sections.hours.enabled ? cleanHours(hours) : undefined;
      
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        categoryIds: categoryId ? [categoryId] : undefined,
        entityType,
        socialMedia: cleanedSocialMedia,
        hours: cleanedHours,
      };

      // Add admin-only fields
      if (adminMode) {
        payload.status = status;
        if (ownerId) {
          payload.ownerId = ownerId;
        }
      }

      let response: Response;
      if (entity) {
        // Update existing entity
        response = await fetch(`/api/entities/${entity.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new entity - include tags in payload
        if (selectedTagIds.length > 0) {
          payload.tagIds = selectedTagIds;
        }
        response = await fetch("/api/entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data: ApiResponse<EntityWithRelations> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save entity");
      }

      const savedEntity = data.data;
      setSuccess(entity ? t("success.updated") : t("success.created"));
      
      // If creating, redirect to edit page so user can add images
      if (!entity && savedEntity) {
        setTimeout(() => {
          router.push(`/portal/entity/${savedEntity.id}`);
        }, 1500);
      } else {
        // Call onSuccess callback if provided, otherwise redirect
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push("/portal/dashboard");
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Error saving entity:", err);
      setError(err instanceof Error ? err.message : "Failed to save entity");
    } finally {
      setLoading(false);
    }
  };

  // Get field hint based on entity type
  const getAddressHint = () => {
    const hintKey = formConfig.fieldHints?.address;
    if (hintKey) {
      return t(`hints.${hintKey}`);
    }
    return undefined;
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Basic Info - Always visible, not collapsible */}
        <div className="space-y-4">
          <div>
            <Input
              type="text"
              label={t("fields.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder={t("placeholders.name")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fields.entityType")}
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fields.category")}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t("placeholders.selectCategory")}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {filteredCategories.length === 0 && entityType && (
              <p className="mt-1 text-sm text-gray-500">
                {t("hints.noCategories", { type: ENTITY_TYPE_LABELS[entityType] })}
              </p>
            )}
          </div>

          {/* Admin-only fields */}
          {adminMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntityStatus)}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={ENTITY_STATUS.ACTIVE}>Active</option>
                  <option value={ENTITY_STATUS.INACTIVE}>Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select an owner</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* About Section */}
        <FormSection
          title={t("sections.about")}
          hasData={hasAboutData}
          defaultExpanded={!!entity && hasAboutData}
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={t("placeholders.description")}
          />
        </FormSection>

        {/* Location & Contact Section */}
        <div ref={locationContactRef}>
          <FormSection
            title={t("sections.locationContact")}
            description={getAddressHint()}
            hasData={hasLocationContactData}
            expanded={locationContactExpanded}
            onExpandedChange={setLocationContactExpanded}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    label={t("fields.address")}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    placeholder={t("placeholders.address")}
                  />
                </div>

                <div>
                  <Input
                    type="tel"
                    label={t("fields.phone")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handlePhoneBlur}
                    disabled={loading}
                    placeholder={t("placeholders.phone")}
                  />
                </div>
              </div>

              <div>
                <Input
                  type="text"
                  label={t("fields.website")}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  onBlur={handleWebsiteBlur}
                  disabled={loading}
                  placeholder={t("placeholders.website")}
                  error={fieldErrors.website}
                />
              </div>
            </div>
          </FormSection>
        </div>

        {/* Hours Section - only for applicable entity types */}
        {formConfig.sections.hours.enabled && (
          <FormSection
            title={t(`sections.${formConfig.sections.hours.titleKey}`)}
            description={formConfig.sections.hours.descriptionKey ? t(`sections.${formConfig.sections.hours.descriptionKey}`) : undefined}
            hasData={hasHoursData}
            defaultExpanded={!!entity && hasHoursData}
          >
            <BusinessHoursInput
              value={hours}
              onChange={setHours}
              disabled={loading}
            />
          </FormSection>
        )}

        {/* Online Presence Section */}
        <div ref={onlinePresenceRef}>
          <FormSection
            title={t("sections.onlinePresence")}
            hasData={hasOnlinePresenceData}
            expanded={onlinePresenceExpanded}
            onExpandedChange={setOnlinePresenceExpanded}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formConfig.socialPlatforms.map((platform) => (
                <Input
                  key={platform}
                  type="text"
                  label={SOCIAL_PLATFORM_CONFIG[platform].label}
                  value={socialMedia[platform] || ""}
                  onChange={(e) => setSocialMedia({ ...socialMedia, [platform]: e.target.value })}
                  onBlur={() => handleSocialMediaBlur(platform)}
                  disabled={loading}
                  placeholder={SOCIAL_PLATFORM_CONFIG[platform].placeholder}
                  error={fieldErrors[platform]}
                />
              ))}
            </div>
          </FormSection>
        </div>

        {/* Media Section - only show for existing entities */}
        {entity && (
          <FormSection
            title={t("sections.media")}
            hasData={!!hasMediaData}
            defaultExpanded={!!hasMediaData}
          >
            <ImageManager
              entityId={entity.id}
              currentImages={entity.images as Record<string, string> | null}
              onImageUpdate={async () => {
                // Refresh entity data after image update
                try {
                  const response = await fetch(`/api/entities/${entity.id}`);
                  const data: ApiResponse<EntityWithRelations> = await response.json();
                  if (data.success && data.data && onEntityUpdate) {
                    onEntityUpdate(data.data);
                  }
                } catch (err) {
                  console.error("Failed to refresh entity:", err);
                }
              }}
            />
          </FormSection>
        )}

        {/* Tags Section */}
        <FormSection
          title={t("sections.tags")}
          description={t("sections.tagsDescription")}
          hasData={hasTagsData}
          defaultExpanded={hasTagsData}
        >
          <div>
            {tagLoading && (
              <span className="text-xs text-gray-500 mb-2 block">{t("loading")}</span>
            )}
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={handleTagChange}
            />
          </div>
        </FormSection>

        {!entity && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {t("hints.addMediaLater")}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading
              ? entity
                ? t("buttons.updating")
                : t("buttons.creating")
              : entity
              ? t("buttons.update")
              : t("buttons.create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/portal/dashboard")}
            disabled={loading}
          >
            {t("buttons.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
