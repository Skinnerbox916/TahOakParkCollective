"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListingEditor } from "@/components/listing/ListingEditor";
import { valuesFrom } from "@/components/listing/values";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Alert } from "@/components/ui/Alert";
import { useAdminTranslations } from "@/lib/admin-translations";
import { AISuggestUpdatesModal } from "@/components/admin/AISuggestUpdatesModal";
import { MembersPanel } from "@/components/admin/MembersPanel";
import { SharePanel } from "@/components/admin/SharePanel";

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
      <SharePanel
        entityId={entity.id}
        entityType={entity.entityType}
        status={entity.status}
        consentedAt={entity.consentedAt ? String(entity.consentedAt) : null}
        consentTermsVersion={entity.consentTermsVersion}
      />
      <MembersPanel entityId={entity.id} />
      {/* After a save the page passes the saved listing back in: its version
          guards the next save, and its values are what the next diff compares to. */}
      <div className="max-w-3xl">
        <ListingEditor
          mode="edit"
          role="admin"
          initial={valuesFrom(entity as unknown as Record<string, unknown>)}
          entityId={entity.id}
          version={entity.version}
          hasMapPin={entity.latitude != null && entity.longitude != null}
          consented={!!entity.consentedAt}
          onSaved={(result) => {
            if (result.kind === "saved") setEntity(result.entity as unknown as EntityWithRelations);
          }}
        />
      </div>
      <AISuggestUpdatesModal
        entity={entity}
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
      />
    </div>
  );
}

