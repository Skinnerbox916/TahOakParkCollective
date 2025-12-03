"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntityDetail } from "@/components/entity/EntityDetail";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Alert } from "@/components/ui/Alert";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminEntityViewPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/entities")}
          >
            ← Back to Entities
          </Button>
        </div>
        <LoadingState message="Loading entity..." />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/entities")}
          >
            ← Back to Entities
          </Button>
        </div>
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
        <Button
          onClick={() => router.push(`/admin/entities/${entity.id}/edit`)}
        >
          Edit Entity
        </Button>
      </div>
      <EntityDetail entity={entity} />
    </div>
  );
}

