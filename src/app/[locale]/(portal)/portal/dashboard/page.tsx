"use client";

import { useEffect, useState } from "react";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { ListingAgreement } from "@/components/entity/ListingAgreement";
import { usePortalTranslations } from "@/lib/admin-translations";
import { useAuth } from "@/lib/use-auth";
import { LISTING_TERMS_VERSION } from "@/lib/entities/policy";
import { ENTITY_STATUS } from "@/lib/prismaEnums";

type OwnedEntity = EntityWithRelations & {
  pendingChanges?: number;
  members?: { role: "OWNER" | "MANAGER"; user: { id: string } }[];
};

export default function PortalDashboard() {
  const [entities, setEntities] = useState<OwnedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<OwnedEntity | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const tPortal = usePortalTranslations("dashboard");
  const { user } = useAuth();

  // Bumped after publishing or unpublishing, to reload the list.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const response = await fetch("/api/entities/owned");
        const data: ApiResponse<OwnedEntity[]> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch entities");
        }

        setError(null);
        setEntities(data.data || []);
      } catch (err) {
        console.error("Error fetching entities:", err);
        setError(err instanceof Error ? err.message : "Failed to load entities");
      } finally {
        setLoading(false);
      }
    }

    fetchEntities();
  }, [reloadKey]);

  const isOwner = (entity: OwnedEntity) =>
    !!user && !!entity.members?.some((m) => m.role === "OWNER" && m.user.id === user.id);

  /** Publish (with the agreement) or unpublish; both take effect immediately. */
  async function setPublished(entity: OwnedEntity, publish: boolean) {
    setBusy(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/entities/${entity.id}/${publish ? "publish" : "unpublish"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publish ? { agreedTermsVersion: LISTING_TERMS_VERSION } : {}),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || tPortal("actionError"));
      setPublishing(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : tPortal("actionError");
      if (publish) setActionError(message);
      else alert(message);
    } finally {
      setBusy(false);
    }
  }

  function openPublish(entity: OwnedEntity) {
    setAgreed(false);
    setActionError(null);
    setPublishing(entity);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{tPortal("title")}</h1>
        <Button href="/portal/entity">{tPortal("addEntity")}</Button>
      </div>

      {error && (
        <Card className="mb-6 bg-error-50 border-error-200">
          <p className="text-error-600">{error || tPortal("errorLoading")}</p>
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
            return (
              <Card key={entity.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {entity.name}
                  </h3>
                  {entity.status === ENTITY_STATUS.ACTIVE ? (
                    <Badge variant="success">{tPortal("published")}</Badge>
                  ) : (
                    <Badge variant="neutral">{tPortal("notPublished")}</Badge>
                  )}
                </div>

                {entity.status !== ENTITY_STATUS.ACTIVE && (
                  <p className="text-sm text-gray-600 mb-2">{tPortal("notPublishedHint")}</p>
                )}

                {!!entity.pendingChanges && (
                  <p className="text-sm text-warning-700 mb-2">
                    {tPortal("pendingChanges", { count: entity.pendingChanges })}
                  </p>
                )}

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

                <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex gap-2">
                    {entity.status === ENTITY_STATUS.ACTIVE && (
                      <Button
                        href={`/entities/${entity.slug}`}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {tPortal("view")}
                      </Button>
                    )}
                    <Button
                      href={`/portal/entity/${entity.id}`}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {tPortal("edit")}
                    </Button>
                  </div>
                  {!isOwner(entity) ? (
                    <p className="text-xs text-gray-500">{tPortal("ownerOnly")}</p>
                  ) : entity.status === ENTITY_STATUS.ACTIVE ? (
                    <Button
                      onClick={() => {
                        if (confirm(tPortal("unpublishConfirm", { name: entity.name }))) setPublished(entity, false);
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      disabled={busy}
                    >
                      {tPortal("unpublish")}
                    </Button>
                  ) : (
                    <Button onClick={() => openPublish(entity)} size="sm" className="w-full" disabled={busy}>
                      {tPortal("publish")}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!publishing}
        onClose={() => !busy && setPublishing(null)}
        title={publishing ? tPortal("publishTitle", { name: publishing.name }) : ""}
        actions={
          <>
            <Button variant="outline" onClick={() => setPublishing(null)} disabled={busy}>
              {tPortal("cancel")}
            </Button>
            <Button onClick={() => publishing && setPublished(publishing, true)} disabled={!agreed || busy}>
              {tPortal("publish")}
            </Button>
          </>
        }
      >
        <ListingAgreement checked={agreed} onChange={setAgreed} disabled={busy} />
        {actionError && (
          <Alert variant="error" className="mt-4">
            {actionError}
          </Alert>
        )}
      </Modal>
    </div>
  );
}
