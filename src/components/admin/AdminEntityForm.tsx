"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApiResponse, Category, SocialMediaLinks } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ENTITY_TYPES } from "@/lib/constants";
import { ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import { formatPhoneNumber, normalizeUrl, isValidUrl } from "@/lib/utils";
import { validateEntityInput } from "@/lib/schemas/entitySchema";

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface AdminEntityFormProps {
  onSuccess?: () => void;
}

export function AdminEntityForm({ onSuccess }: AdminEntityFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.entityForm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState<EntityStatus>(ENTITY_STATUS.ACTIVE);
  const [entityType, setEntityType] = useState<EntityType>(ENTITY_TYPE.COMMERCE);
  
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

  // Handle website URL normalization on blur
  const handleWebsiteBlur = () => {
    const normalized = normalizeUrl(website);
    if (normalized !== website) {
      setWebsite(normalized);
    }
    // Validate
    if (normalized) {
      if (isValidUrl(normalized)) {
        setFieldErrors(prev => {
          const { website: _, ...rest } = prev;
          return rest;
        });
      } else {
        setFieldErrors(prev => ({ ...prev, website: "Please enter a valid URL" }));
      }
    } else {
      setFieldErrors(prev => {
        const { website: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle social media URL normalization on blur
  const handleSocialBlur = (platform: keyof SocialMediaLinks) => {
    const value = socialMedia[platform];
    if (!value) return;

    const normalized = normalizeUrl(value);
    if (normalized !== value) {
      setSocialMedia(prev => ({ ...prev, [platform]: normalized }));
    }
    // Validate
    if (normalized) {
      if (isValidUrl(normalized)) {
        setFieldErrors(prev => {
          const { [platform]: _, ...rest } = prev;
          return rest;
        });
      } else {
        setFieldErrors(prev => ({ ...prev, [platform]: `Please enter a valid ${platform} URL` }));
      }
    } else {
      setFieldErrors(prev => {
        const { [platform]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Load categories and users
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesResponse, usersResponse] = await Promise.all([
          fetch(`/api/categories?entityType=${entityType}`),
          fetch("/api/admin/users"),
        ]);

        const categoriesData: ApiResponse<Category[]> = await categoriesResponse.json();
        if (categoriesResponse.ok && categoriesData.success) {
          setCategories(categoriesData.data || []);
        }

        const usersData: ApiResponse<User[]> = await usersResponse.json();
        if (usersResponse.ok && usersData.success) {
          setUsers(usersData.data || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    loadData();
  }, [entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ownerId) {
      setFieldErrors(prev => ({ ...prev, ownerId: "Please select an owner" }));
      setError("Please select an owner");
      return;
    }

    const candidate = {
      name,
      description,
      address,
      phone,
      website,
      socialMedia,
    };

    const validationResult = validateEntityInput(candidate);
    if (!validationResult.success) {
      // Translate i18n error keys to user-facing messages
      const translated: Record<string, string> = {};
      for (const [field, message] of Object.entries(validationResult.fieldErrors)) {
        // Check if message is an i18n key (starts with "validation.")
        if (message.startsWith("validation.")) {
          const key = message.replace("validation.", "");
          translated[field] = t(`validation.${key}`, { platform: field });
        } else {
          translated[field] = message;
        }
      }
      setFieldErrors(translated);
      setError(t("validation.fixErrors"));
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const normalized = validationResult.data;

      const payload = {
        name: normalized.name,
        description: normalized.description || undefined,
        address: normalized.address || undefined,
        phone: normalized.phone || undefined,
        website: normalized.website || undefined,
        categoryIds: categoryId ? [categoryId] : undefined,
        ownerId,
        status,
        entityType,
        socialMedia: normalized.socialMedia ?? null,
      };

      const response = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create entity");
      }

      setSuccess("Entity created successfully!");
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setTimeout(() => {
          router.push("/admin/entities");
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating entity:", err);
      setError(err instanceof Error ? err.message : "Failed to create entity");
    } finally {
      setLoading(false);
    }
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

        <div>
          <Input
            type="text"
            label="Entity Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter entity name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Type *
          </label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value as EntityType);
              setCategoryId(""); // Reset category when entity type changes
            }}
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
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe the entity..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              placeholder="Street address"
            />
          </div>

          <div>
            <Input
              type="tel"
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              placeholder="(555) 123-4567"
              error={fieldErrors.phone}
            />
          </div>
        </div>

        <div>
          <Input
            type="text"
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={handleWebsiteBlur}
            disabled={loading}
            placeholder="https://example.com"
            error={fieldErrors.website}
          />
        </div>

        {/* Social Media Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Media Links
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="text"
                label="Facebook"
                value={socialMedia.facebook || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                onBlur={() => handleSocialBlur("facebook")}
                disabled={loading}
                placeholder="https://facebook.com/yourpage"
                error={fieldErrors.facebook}
              />
              <Input
                type="text"
                label="Instagram"
                value={socialMedia.instagram || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                onBlur={() => handleSocialBlur("instagram")}
                disabled={loading}
                placeholder="https://instagram.com/yourpage"
                error={fieldErrors.instagram}
              />
              <Input
                type="text"
                label="Twitter"
                value={socialMedia.twitter || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                onBlur={() => handleSocialBlur("twitter")}
                disabled={loading}
                placeholder="https://twitter.com/yourpage"
                error={fieldErrors.twitter}
              />
              <Input
                type="text"
                label="LinkedIn"
                value={socialMedia.linkedin || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                onBlur={() => handleSocialBlur("linkedin")}
                disabled={loading}
                placeholder="https://linkedin.com/company/yourpage"
                error={fieldErrors.linkedin}
              />
              <Input
                type="text"
                label="Yelp"
                value={socialMedia.yelp || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, yelp: e.target.value })}
                onBlur={() => handleSocialBlur("yelp")}
                disabled={loading}
                placeholder="https://yelp.com/biz/yourpage"
                error={fieldErrors.yelp}
              />
              <Input
                type="text"
                label="TikTok"
                value={socialMedia.tiktok || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                onBlur={() => handleSocialBlur("tiktok")}
                disabled={loading}
                placeholder="https://tiktok.com/@yourpage"
                error={fieldErrors.tiktok}
              />
              <Input
                type="text"
                label="YouTube"
                value={socialMedia.youtube || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                onBlur={() => handleSocialBlur("youtube")}
                disabled={loading}
                placeholder="https://youtube.com/@yourchannel"
                error={fieldErrors.youtube}
              />
              <Input
                type="text"
                label="Threads"
                value={socialMedia.threads || ""}
                onChange={(e) => setSocialMedia({ ...socialMedia, threads: e.target.value })}
                onBlur={() => handleSocialBlur("threads")}
                disabled={loading}
                placeholder="https://threads.net/@yourpage"
                error={fieldErrors.threads}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner *
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              disabled={loading}
              required
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
        </div>

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

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Entity"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/entities")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

