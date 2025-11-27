"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { EntityWithRelations, ApiResponse, Category, EntityTagWithTag } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "@/lib/constants";
import type { EntityType } from "@/lib/prismaEnums";
import { TagSelector } from "@/components/tags/TagSelector";
import { ImageManager } from "@/components/images/ImageManager";
import { COVERAGE_AREA_OPTIONS } from "@/lib/coverage-areas";
import { geocodeAddress, getCoverageArea } from "@/lib/geocoding";

interface EntityFormProps {
  entity?: EntityWithRelations;
  onSuccess?: () => void;
  onEntityUpdate?: (entity: EntityWithRelations) => void;
}

export function EntityForm({ entity, onSuccess, onEntityUpdate }: EntityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

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

  // Load categories and populate form if editing
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        const data: ApiResponse<Category[]> = await response.json();
        if (response.ok && data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    }

    loadCategories();

    // Populate form if editing
    if (entity) {
      setName(entity.name || "");
      setDescription(entity.description || "");
      setAddress(entity.address || "");
      setPhone(entity.phone || "");
      setWebsite(entity.website || "");
      setCategoryId(entity.categoryId || "");
      setEntityType(entity.entityType || "COMMERCE");
      // Load tags
      if (entity.tags) {
        const tagIds = (entity.tags as EntityTagWithTag[]).map(et => et.tag.id);
        setSelectedTagIds(tagIds);
      }
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

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return "Entity name is required";
    }

    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        return "Please enter a valid website URL (e.g., https://example.com)";
      }
    }

    return null;
  };

  const handleTagChange = async (newTagIds: string[]) => {
    if (!entity?.id) return; // Can only manage tags on existing entities

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        categoryId: categoryId || undefined,
        entityType,
      };

      let response: Response;
      if (entity) {
        // Update existing entity
        response = await fetch(`/api/entities/${entity.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new entity
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
      setSuccess(entity ? "Entity updated successfully!" : "Entity created successfully!");
      
      // If creating, redirect to edit page so user can add tags and images
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
            />
          </div>
        </div>

        <div>
          <Input
            type="url"
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
            placeholder="https://example.com"
          />
        </div>

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
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {filteredCategories.length === 0 && entityType && (
            <p className="mt-1 text-sm text-gray-500">
              No categories available for {ENTITY_TYPE_LABELS[entityType]}
            </p>
          )}
        </div>

        {/* Images - only show for existing entities */}
        {entity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Images
            </label>
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
          </div>
        )}

        {/* Tags - only show for existing entities */}
        {entity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags {tagLoading && <span className="text-xs text-gray-500">(updating...)</span>}
            </label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={handleTagChange}
            />
            <p className="mt-2 text-xs text-gray-500">
              Identity tags apply immediately. Friendliness tags require admin verification.
            </p>
          </div>
        )}

        {!entity && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            💡 You can add images and tags after creating the entity.
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
                ? "Updating..."
                : "Creating..."
              : entity
              ? "Update Entity"
              : "Create Entity"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/portal/dashboard")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

