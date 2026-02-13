"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntityPreview } from "@/components/admin/EntityPreview";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Alert } from "@/components/ui/Alert";
import { useAdminTranslations } from "@/lib/admin-translations";
import { AISuggestUpdatesModal } from "@/components/admin/AISuggestUpdatesModal";

export default function AdminEditEntityPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { t } = useAdminTranslations("entities");

  useEffect(() => {
    async function fetchEntity() {
      if (!params.id || typeof params.id !== "string") {
        setError("Invalid entity ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/entities/${params.id}`);
        const data: ApiResponse<EntityWithRelations> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load entity");
        }

        setEntity(data.data!);
      } catch (err) {
        console.error("Error fetching entity:", err);
        setError(err instanceof Error ? err.message : "Failed to load entity");
      } finally {
        setLoading(false);
      }
    }

    fetchEntity();
  }, [params.id]);

  const handleSuccess = () => {
    router.push("/admin/entities");
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/entities")}
          >
            ← Back to Entities
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Entity
        </h1>
        <LoadingState message="Loading entity..." />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/entities")}
          >
            ← Back to Entities
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Entity
        </h1>
        <Alert variant="error">
          {error || "Entity not found"}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/entities")}
        >
          ← Back to Entities
        </Button>
        <Button variant="outline" onClick={() => setSuggestionsOpen(true)}>
          🤖 {t("aiSuggestUpdates")}
        </Button>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Edit Entity: {entity.name}
      </h1>
      <EntityPreview
        entityData={{
          name: entity.name,
          slug: entity.slug,
          description: entity.description || "",
          descriptionTranslations: entity.descriptionTranslations as any,
          nameTranslations: entity.nameTranslations as any,
          address: entity.address,
          phone: entity.phone,
          website: entity.website,
          latitude: entity.latitude,
          longitude: entity.longitude,
          entityType: entity.entityType,
          hours: entity.hours as any,
          socialMedia: entity.socialMedia as any,
          displaySettings: (entity as any).displaySettings || null,
          categorySlugs: entity.categories.map((c) => c.slug),
          tagSlugs: (entity.tags || []).map((t: any) => t.tag?.slug).filter(Boolean),
          images: (entity as any).images,
          seoTitleTranslations: (entity as any).seoTitleTranslations,
          seoDescriptionTranslations: (entity as any).seoDescriptionTranslations,
        }}
        resolvedCategories={entity.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        resolvedTags={(entity.tags || []).map((et: any) => ({
          id: et.tag.id,
          name: et.tag.name,
          slug: et.tag.slug,
          category: et.tag.category,
        }))}
        entityId={entity.id}
        mode="admin"
        editable
        onDataUpdated={() => handleSuccess()}
      />
      <AISuggestUpdatesModal
        entity={entity}
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
      />
    </div>
  );
}

