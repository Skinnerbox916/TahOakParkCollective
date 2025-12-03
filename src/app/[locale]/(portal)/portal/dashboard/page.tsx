"use client";

import { useEffect, useState } from "react";
import { EntityWithRelations, ApiResponse } from "@/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePortalTranslations } from "@/lib/admin-translations";

interface EntityStats {
  pageviews: number;
  visitors: number;
}

export default function PortalDashboard() {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityStats, setEntityStats] = useState<Record<string, EntityStats>>({});
  const tPortal = usePortalTranslations("dashboard");

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

  // Fetch analytics for each entity after entities are loaded
  useEffect(() => {
    async function fetchStats() {
      if (entities.length === 0) return;

      const statsPromises = entities.map(async (entity) => {
        try {
          const response = await fetch(`/api/entities/${entity.id}/stats`);
          const data: ApiResponse<EntityStats> = await response.json();
          if (data.success && data.data) {
            return { id: entity.id, stats: data.data };
          }
        } catch (err) {
          console.error(`Error fetching stats for entity ${entity.id}:`, err);
        }
        return { id: entity.id, stats: { pageviews: 0, visitors: 0 } };
      });

      const results = await Promise.all(statsPromises);
      const statsMap: Record<string, EntityStats> = {};
      for (const result of results) {
        statsMap[result.id] = result.stats;
      }
      setEntityStats(statsMap);
    }

    fetchStats();
  }, [entities]);

  const handleDelete = async (entityId: string, entityName: string) => {
    if (!confirm(tPortal("deleteConfirm", { name: entityName }))) {
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
      alert(err instanceof Error ? err.message : tPortal("errorLoading"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{tPortal("title")}</h1>
        <Button href="/portal/entity">{tPortal("addEntity")}</Button>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error || tPortal("errorLoading")}</p>
        </Card>
      )}

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{tPortal("loading")}</p>
          </div>
        </Card>
      ) : entities.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tPortal("emptyHeading")}
            </h3>
            <p className="text-gray-600 mb-6">
              {tPortal("emptyDescription")}
            </p>
            <Button href="/portal/entity">{tPortal("addFirst")}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => {
            const stats = entityStats[entity.id];
            return (
              <Card key={entity.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {entity.name}
                  </h3>
                  <StatusBadge status={entity.status} />
                </div>

                {entity.categories && entity.categories.length > 0 && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{tPortal("categoryLabel")}</span>{" "}
                    {entity.categories.map((c) => c.name).join(", ")}
                  </p>
                )}

                {entity.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                    {entity.description}
                  </p>
                )}

                {/* Analytics Section */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-2">{tPortal("last30Days")}</p>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.pageviews ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{tPortal("pageViews")}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.visitors ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{tPortal("visitors")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      href={`/entities/${entity.slug}`}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {tPortal("view")}
                    </Button>
                    <Button
                      href={`/portal/entity/${entity.id}`}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      {tPortal("edit")}
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleDelete(entity.id, entity.name)}
                    variant="danger"
                    size="sm"
                    className="w-full"
                  >
                    {tPortal("delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
