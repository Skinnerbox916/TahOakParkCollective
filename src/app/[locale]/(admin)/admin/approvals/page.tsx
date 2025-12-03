"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { ApiResponse, ApprovalWithEntity } from "@/types";
import { ApprovalStatus, ApprovalType } from "@/lib/prismaEnums";
import { Link } from "@/i18n/routing";
import { useAdminTranslations } from "@/lib/admin-translations";

const getStatusVariant = (status: ApprovalStatus): "success" | "warning" | "error" | "neutral" => {
  switch (status) {
    case ApprovalStatus.APPROVED:
      return "success";
    case ApprovalStatus.PENDING:
      return "warning";
    case ApprovalStatus.REJECTED:
      return "error";
    default:
      return "neutral";
  }
};

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithEntity[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>(ApprovalStatus.PENDING);
  const [typeFilter, setTypeFilter] = useState<ApprovalType | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const { t, tStatus } = useAdminTranslations("approvals");
  const { t: tCommon } = useAdminTranslations("common");

  const getTypeLabel = (type: ApprovalType): string => {
    return t(`types.${type}`);
  };

  const getSourceLabel = (source: string): string => {
    return t(`sources.${source}`);
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      
      const response = await fetch(`/api/admin/approvals?${params.toString()}`);
      const data: ApiResponse<ApprovalWithEntity[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch approvals");
      }

      setApprovals(data.data || []);
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter, typeFilter]);

  const handleReview = async (approvalId: string, action: "APPROVE" | "REJECT") => {
    try {
      setProcessing(approvalId);
      setError(null);

      const response = await fetch(`/api/admin/approvals/${approvalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process approval");
      }

      await fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process approval");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEntityDisplayName = (approval: ApprovalWithEntity): string => {
    if (approval.type === ApprovalType.NEW_ENTITY && approval.entityData) {
      const data = approval.entityData as Record<string, unknown>;
      return data.name as string || t("types.NEW_ENTITY");
    }
    return approval.entity?.name || `Entity ID: ${approval.entityId}`;
  };

  const pendingCount = approvals.filter((a) => a.status === ApprovalStatus.PENDING).length;

  return (
    <div>
      <PageHeader 
        title={t("title")}
        description={t("description")}
      />

      {/* Filters */}
      <FilterBar>
        <Select
          label={t("status")}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus)}
        >
          <option value={ApprovalStatus.PENDING}>
            {tStatus(ApprovalStatus.PENDING)} ({pendingCount})
          </option>
          <option value={ApprovalStatus.APPROVED}>{tStatus(ApprovalStatus.APPROVED)}</option>
          <option value={ApprovalStatus.REJECTED}>{tStatus(ApprovalStatus.REJECTED)}</option>
        </Select>
        
        <Select
          label={t("type")}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ApprovalType | "")}
        >
          <option value="">{t("allTypes")}</option>
          {Object.values(ApprovalType).map((type) => (
            <option key={type} value={type}>{getTypeLabel(type)}</option>
          ))}
        </Select>
        
        <div className="flex items-end">
          <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
            {tCommon("refresh")}
          </Button>
        </div>
      </FilterBar>

      {/* Error State */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingState message={t("loading")} />
      ) : approvals.length === 0 ? (
        <Card>
          <EmptyState
            icon="✅"
            title={t("noApprovals")}
            description={
              statusFilter === ApprovalStatus.PENDING 
                ? t("allReviewed")
                : t("noMatches")
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Link
                      href={`/admin/approvals/${approval.id}`}
                      className="text-xl font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {getEntityDisplayName(approval)}
                    </Link>
                    <Badge 
                      variant={getStatusVariant(approval.status as ApprovalStatus)}
                      size="sm"
                    >
                      {tStatus(approval.status as ApprovalStatus)}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {getTypeLabel(approval.type as ApprovalType)}
                    </Badge>
                    {approval.source && (
                      <Badge variant="neutral" size="sm">
                        {getSourceLabel(approval.source)}
                      </Badge>
                    )}
                  </div>

                  {approval.type === ApprovalType.NEW_ENTITY && approval.entityData && (
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      {(approval.entityData as Record<string, unknown>).address && (
                        <p>📍 {(approval.entityData as Record<string, unknown>).address as string}</p>
                      )}
                      {(approval.entityData as Record<string, unknown>).website && (
                        <p>
                          🌐{" "}
                          <a
                            href={(approval.entityData as Record<string, unknown>).website as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {(approval.entityData as Record<string, unknown>).website as string}
                          </a>
                        </p>
                      )}
                      {(approval.entityData as Record<string, unknown>).entityType && (
                        <p>Type: {(approval.entityData as Record<string, unknown>).entityType as string}</p>
                      )}
                    </div>
                  )}

                  {approval.type !== ApprovalType.NEW_ENTITY && approval.entity && (
                    <p className="text-sm text-gray-600 mb-3">
                      {t("detail.entity")} {approval.entity.name}
                      {approval.fieldName && ` • ${t("detail.field")}: ${approval.fieldName}`}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{t("submitted")} {formatDate(approval.createdAt)}</span>
                    {approval.submitterEmail && (
                      <span>{t("submittedBy")} {approval.submitterEmail}</span>
                    )}
                  </div>
                </div>

                {approval.status === ApprovalStatus.PENDING && (
                  <div className="flex gap-2">
                    <Link href={`/admin/approvals/${approval.id}`}>
                      <Button variant="outline" size="sm">
                        {tCommon("review")}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(approval.id, "APPROVE")}
                      disabled={processing !== null}
                    >
                      {processing === approval.id ? "..." : `✓ ${tCommon("approve")}`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(approval.id, "REJECT")}
                      disabled={processing !== null}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {processing === approval.id ? "..." : `✗ ${tCommon("reject")}`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
