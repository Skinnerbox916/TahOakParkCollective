"use client";

import { useState, useEffect } from "react";
import { SpotCheckList } from "@/components/admin/SpotCheckList";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminSpotChecksPage() {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAdminTranslations("spotChecks");

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
      <PageHeader 
        title={t("title")}
        description={t("description")}
        action={
          <Button onClick={fetchSpotChecks} disabled={loading} variant="outline">
            {t("refreshList")}
          </Button>
        }
      />

      {/* Error State */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert variant="info">
        <p className="text-sm">
          <strong>{t("tip")}</strong> {t("tipText")}
        </p>
      </Alert>

      {/* Loading State */}
      {loading ? (
        <LoadingState message={t("loading")} />
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
