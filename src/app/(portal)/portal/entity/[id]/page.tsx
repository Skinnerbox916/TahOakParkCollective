"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EntityForm } from "@/components/entity/EntityForm";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";

export default function PortalEditEntityPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(data.error || "Failed to fetch entity");
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Entity</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading entity...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Entity</h1>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || "Entity not found"}</p>
          <button
            onClick={() => router.push("/portal/dashboard")}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  const handleEntityUpdate = (updatedEntity: EntityWithRelations) => {
    setEntity(updatedEntity);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Entity</h1>
      <EntityForm
        entity={entity}
        onSuccess={() => router.push("/portal/dashboard")}
        onEntityUpdate={handleEntityUpdate}
      />
    </div>
  );
}

