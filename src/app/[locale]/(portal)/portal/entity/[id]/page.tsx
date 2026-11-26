"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { ListingEditor } from "@/components/listing/ListingEditor";
import { imagesFrom, valuesFrom } from "@/components/listing/values";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { usePortalTranslations } from "@/lib/admin-translations";

export default function PortalEditEntityPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tPortal = usePortalTranslations("entity");

  useEffect(() => {
    async function fetchEntity() {
      if (!params.id || typeof params.id !== "string") {
        setError(tPortal("invalidId"));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/entities/${params.id}`);
        const data: ApiResponse<EntityWithRelations> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || tPortal("errorLoading"));
        }

        setEntity(data.data!);
      } catch (err) {
        console.error("Error fetching entity:", err);
        setError(err instanceof Error ? err.message : tPortal("errorLoading"));
      } finally {
        setLoading(false);
      }
    }

    fetchEntity();
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {tPortal("editTitle")}
        </h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{tPortal("loading")}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {tPortal("editTitle")}
        </h1>
        <Card className="bg-error-50 border-error-200">
          <p className="text-error-600">{error || tPortal("notFound")}</p>
          <button
            onClick={() => router.push("/portal/dashboard")}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            {tPortal("back")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {tPortal("editTitle")}
      </h1>
      <ListingEditor
        mode="edit"
        role="owner"
        initial={valuesFrom(entity as unknown as Record<string, unknown>)}
        entityId={entity.id}
        version={entity.version}
        hasMapPin={entity.latitude != null && entity.longitude != null}
        images={imagesFrom(entity as unknown as Record<string, unknown>)}
        onSaved={() => setTimeout(() => router.push("/portal/dashboard"), 2500)}
        onCancel={() => router.push("/portal/dashboard")}
      />
    </div>
  );
}

