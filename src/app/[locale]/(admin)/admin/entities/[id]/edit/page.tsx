"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntityForm } from "@/components/entity/EntityForm";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Alert } from "@/components/ui/Alert";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminEditEntityPage() {
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
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/entities")}
        >
          ← Back to Entities
        </Button>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Edit Entity: {entity.name}
      </h1>
      <EntityForm
        entity={entity}
        adminMode={true}
        onSuccess={handleSuccess}
        onEntityUpdate={(updatedEntity) => setEntity(updatedEntity)}
      />
    </div>
  );
}

