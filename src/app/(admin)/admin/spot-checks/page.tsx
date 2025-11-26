"use client";

import { useState, useEffect } from "react";
import { SpotCheckList } from "@/components/admin/SpotCheckList";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminSpotChecksPage() {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSpotChecks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/spot-checks");
      const data: ApiResponse<EntityWithRelations[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch spot check list");
      }

      setEntities(data.data || []);
    } catch (err) {
      console.error("Error fetching spot checks:", err);
      setError(err instanceof Error ? err.message : "Failed to load spot check list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpotChecks();
  }, []);

  const handleMarkChecked = async (entityId: string) => {
    try {
      setMarking(entityId);
      setError(null);

      const response = await fetch(`/api/admin/entities/${entityId}/spot-check`, {
        method: "PUT",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to mark entity as checked");
      }

      // Refresh the list
      await fetchSpotChecks();
    } catch (err) {
      console.error("Error marking spot check:", err);
      setError(err instanceof Error ? err.message : "Failed to mark entity as checked");
    } finally {
      setMarking(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Spot Checks</h1>
        <p className="mt-2 text-sm text-gray-600">
          Weekly spot check list. Review 3-5 entities to ensure data quality. Entities not checked in 6+ months are prioritized.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Review each entity and verify that the information is accurate. 
            Click "Mark as Checked" when complete.
          </p>
        </Card>
        <Button onClick={fetchSpotChecks} disabled={loading} variant="outline">
          Refresh List
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading spot check list...</p>
          </div>
        </Card>
      ) : (
        <SpotCheckList
          entities={entities}
          onMarkChecked={handleMarkChecked}
          loading={marking !== null}
        />
      )}
    </div>
  );
}

