"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import { ApprovalStatus, ApprovalType } from "@/lib/prismaEnums";
import { Link } from "@/i18n/routing";
import { EntityPreview } from "@/components/admin/EntityPreview";
import { useAdminTranslations } from "@/lib/admin-translations";
import type { Approval } from "@prisma/client";

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

interface ResolvedCategory {
  id: string;
  name: string;
  slug: string;
}

interface ResolvedTag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface ApprovalWithEntityDetails extends Approval {
  entity: {
    id: string;
    name: string;
    slug: string;
    categories: Array<{ id: string; name: string; slug: string }>;
    owner: { id: string; name: string | null; email: string | null };
    tags: Array<{ id: string; tag: { id: string; name: string; slug: string; category: string } }>;
  } | null;
  resolvedCategories?: ResolvedCategory[];
  resolvedTags?: ResolvedTag[];
}

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalWithEntityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  
  const { t, tStatus } = useAdminTranslations("approvals");
  const { t: tCommon } = useAdminTranslations("common");

  const getTypeLabel = (type: ApprovalType): string => {
    return t(`types.${type}`);
  };

  const getSourceLabel = (source: string | null): string => {
    if (!source) return "Unknown";
    return t(`sources.${source}`);
  };

  const fetchApproval = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/approvals/${params.id}`);
      const data: ApiResponse<ApprovalWithEntityDetails> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch approval");
      }

      setApproval(data.data || null);
    } catch (err) {
      console.error("Error fetching approval:", err);
      setError(err instanceof Error ? err.message : "Failed to load approval");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchApproval();
    }
  }, [params.id]);

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/admin/approvals/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process approval");
      }

      // Redirect back to approvals list
      router.push("/admin/approvals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process approval");
      setProcessing(false);
    }
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatHours = (hours: Record<string, { open: string | null; close: string | null; closed: boolean }> | null): string => {
    if (!hours) return "Not specified";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    return days
      .map((day) => {
        const h = hours[day];
        if (!h || h.closed) return `${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`;
        return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${h.open || "?"} - ${h.close || "?"}`;
      })
      .join("\n");
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("detail.title")}</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("detail.title")}</h1>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || t("detail.notFound")}</p>
          <Link href="/admin/approvals" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
            {t("detail.backToApprovals")}
          </Link>
        </Card>
      </div>
    );
  }

  const entityData = approval.entityData as Record<string, unknown> | null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/approvals" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            {t("detail.backToApprovals")}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t("detail.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              STATUS_COLORS[approval.status as ApprovalStatus]
            }`}
          >
            {tStatus(approval.status as ApprovalStatus)}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Entity Preview (for NEW_ENTITY) */}
      {approval.type === ApprovalType.NEW_ENTITY && entityData && (
        <div className="mb-6">
          <EntityPreview
            entityData={entityData as Record<string, unknown>}
            resolvedCategories={approval.resolvedCategories || []}
            resolvedTags={approval.resolvedTags || []}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Info */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("detail.approvalInfo")}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("type")}</dt>
              <dd className="text-gray-900">{getTypeLabel(approval.type as ApprovalType)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("detail.source")}</dt>
              <dd className="text-gray-900">{getSourceLabel(approval.source)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("submitted")}</dt>
              <dd className="text-gray-900">{formatDate(approval.createdAt)}</dd>
            </div>
            {approval.submitterEmail && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t("submittedBy")}</dt>
                <dd className="text-gray-900">{approval.submitterEmail}</dd>
              </div>
            )}
            {approval.reviewedAt && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("detail.reviewed")}</dt>
                  <dd className="text-gray-900">{formatDate(approval.reviewedAt)}</dd>
                </div>
                {approval.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.reviewNotes")}</dt>
                    <dd className="text-gray-900">{approval.notes}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </Card>

        {/* Raw Entity Data (for NEW_ENTITY) - collapsed by default */}
        {approval.type === ApprovalType.NEW_ENTITY && entityData && (
          <Card>
            <details className="group">
              <summary className="cursor-pointer text-xl font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span>{t("detail.rawEntityData")}</span>
                <span className="text-sm font-normal text-gray-500 group-open:hidden">{t("detail.clickToExpand")}</span>
              </summary>
              <dl className="space-y-3 mt-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("detail.slug")}</dt>
                  <dd className="text-gray-900 font-mono text-sm">{entityData.slug as string || "N/A"}</dd>
                </div>
                {entityData.latitude && entityData.longitude && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.coordinates")}</dt>
                    <dd className="text-gray-900 font-mono text-sm">
                      {entityData.latitude as number}, {entityData.longitude as number}
                    </dd>
                  </div>
                )}
                {entityData.categorySlugs && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.categorySlugs")}</dt>
                    <dd className="text-gray-900 font-mono text-sm">{(entityData.categorySlugs as string[]).join(", ")}</dd>
                  </div>
                )}
                {entityData.tagSlugs && (entityData.tagSlugs as string[]).length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.tagSlugs")}</dt>
                    <dd className="text-gray-900 font-mono text-sm">{(entityData.tagSlugs as string[]).join(", ")}</dd>
                  </div>
                )}
                {entityData.hours && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.hoursRaw")}</dt>
                    <dd className="text-gray-900 text-sm whitespace-pre-line font-mono bg-gray-50 p-2 rounded">
                      {formatHours(entityData.hours as Record<string, { open: string | null; close: string | null; closed: boolean }>)}
                    </dd>
                  </div>
                )}
                {entityData.nameTranslations && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.nameTranslations")}</dt>
                    <dd className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(entityData.nameTranslations, null, 2)}</pre>
                    </dd>
                  </div>
                )}
                {entityData.descriptionTranslations && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("detail.descriptionTranslations")}</dt>
                    <dd className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(entityData.descriptionTranslations, null, 2)}</pre>
                    </dd>
                  </div>
                )}
              </dl>
            </details>
          </Card>
        )}

        {/* Change Data (for UPDATE_ENTITY, etc.) */}
        {approval.type !== ApprovalType.NEW_ENTITY && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("detail.changeDetails")}</h2>
            {approval.entity && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("detail.entity")}{" "}
                  <Link 
                    href={`/entities/${approval.entity.slug}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {approval.entity.name}
                  </Link>
                </p>
              </div>
            )}
            <dl className="space-y-3">
              {approval.fieldName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("detail.field")}</dt>
                  <dd className="text-gray-900">{approval.fieldName}</dd>
                </div>
              )}
              {approval.oldValue && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("detail.oldValue")}</dt>
                  <dd className="text-gray-900 bg-red-50 p-2 rounded text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(approval.oldValue, null, 2)}</pre>
                  </dd>
                </div>
              )}
              {approval.newValue && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t("detail.newValue")}</dt>
                  <dd className="text-gray-900 bg-green-50 p-2 rounded text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(approval.newValue, null, 2)}</pre>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        )}
      </div>

      {/* Actions */}
      {approval.status === ApprovalStatus.PENDING && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("detail.reviewAction")}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                {tCommon("notesOptional")}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={tCommon("notesPlaceholder")}
                disabled={processing}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("APPROVE")}
                disabled={processing}
              >
                {processing ? tCommon("processing") : `✓ ${tCommon("approve")}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("REJECT")}
                disabled={processing}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {processing ? tCommon("processing") : `✗ ${tCommon("reject")}`}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
