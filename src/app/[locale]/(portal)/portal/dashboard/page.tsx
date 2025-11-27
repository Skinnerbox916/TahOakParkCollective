"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { EntityWithRelations, ApiResponse } from "@/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PortalDashboard() {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchEntities() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/entities/owned");
        const data: ApiResponse<EntityWithRelations[]> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch entities");
        }

        setEntities(data.data || []);
      } catch (err) {
        console.error("Error fetching entities:", err);
        setError(err instanceof Error ? err.message : "Failed to load entities");
      } finally {
        setLoading(false);
      }
    }

    fetchEntities();
  }, []);

  const handleDelete = async (entityId: string, entityName: string) => {
    if (!confirm(`Are you sure you want to delete "${entityName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/entities/${entityId}`, {
        method: "DELETE",
      });
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete entity");
      }

      // Remove from list
      setEntities((prev) => prev.filter((e) => e.id !== entityId));
    } catch (err) {
      console.error("Error deleting entity:", err);
      alert(err instanceof Error ? err.message : "Failed to delete entity");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Entities</h1>
        <Button href="/portal/entity">Add Entity</Button>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading entities...</p>
          </div>
        </Card>
      ) : entities.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No entities yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first entity to the directory.
            </p>
            <Button href="/portal/entity">Add Your First Entity</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <Card key={entity.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900 flex-1">
                  {entity.name}
                </h3>
                <StatusBadge status={entity.status} />
              </div>

              {entity.category && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Category:</span> {entity.category.name}
                </p>
              )}

              {entity.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                  {entity.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                <div className="flex gap-2">
                  <Button
                    href={`/entities/${entity.slug}`}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    View
                  </Button>
                  <Button
                    href={`/portal/entity/${entity.id}`}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    Edit
                  </Button>
                </div>
                <Button
                  onClick={() => handleDelete(entity.id, entity.name)}
                  variant="danger"
                  size="sm"
                  className="w-full"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
