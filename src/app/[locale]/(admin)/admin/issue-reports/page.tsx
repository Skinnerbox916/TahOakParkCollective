"use client";

import { useState, useEffect } from "react";
import { ReportStatus, IssueType } from "@/lib/prismaEnums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import { Link } from "@/i18n/routing";

interface IssueReport {
  id: string;
  entityId: string;
  issueType: IssueType;
  description: string;
  submitterEmail: string;
  submitterName: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
  entity: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
  } | null;
}

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  INCORRECT_INFO: "Incorrect Information",
  CLOSED: "Closed/Permanently Closed",
  INELIGIBLE: "Not Eligible",
  OTHER: "Other Issue",
};

export default function AdminIssueReportsPage() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>(ReportStatus.PENDING);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"RESOLVE" | "DISMISS" | null>(null);
  const [resolution, setResolution] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/issue-reports?status=${statusFilter}`
      );
      const data: ApiResponse<IssueReport[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch issue reports");
      }

      setReports(data.data || []);
    } catch (err) {
      console.error("Error fetching issue reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load issue reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleReview = async (reportId: string, action: "RESOLVE" | "DISMISS", resolution?: string) => {
    try {
      setProcessing(reportId);
      setError(null);

      const response = await fetch(`/api/admin/issue-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution: resolution || undefined }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process report");
      }

      await fetchReports();
      setSelectedReport(null);
      setAction(null);
      setResolution("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process report");
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenModal = (report: IssueReport, actionType: "RESOLVE" | "DISMISS") => {
    setSelectedReport(report);
    setAction(actionType);
    setResolution(report.resolution || "");
  };

  const handleSubmitAction = () => {
    if (!selectedReport || !action) return;
    handleReview(selectedReport.id, action, resolution.trim() || undefined);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Issue Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and resolve issue reports from the community about entity listings.
        </p>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={ReportStatus.PENDING}>Pending</option>
            <option value={ReportStatus.RESOLVED}>Resolved</option>
            <option value={ReportStatus.DISMISSED}>Dismissed</option>
          </select>
          <Button variant="outline" onClick={fetchReports} disabled={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading issue reports...</p>
          </div>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No issue reports found
            </h3>
            <p className="text-gray-600">
              All reports have been reviewed.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {report.entity ? (
                      <Link
                        href={`/entities/${report.entity.slug}`}
                        className="text-xl font-semibold text-indigo-600 hover:text-indigo-800"
                        target="_blank"
                      >
                        {report.entity.name} →
                      </Link>
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-900">
                        Entity (ID: {report.entityId})
                      </h3>
                    )}
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === ReportStatus.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          : report.status === ReportStatus.RESOLVED
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                      {ISSUE_TYPE_LABELS[report.issueType]}
                    </span>
                  </div>

                  {report.entity?.address && (
                    <p className="text-sm text-gray-600 mb-3">
                      📍 {report.entity.address}
                    </p>
                  )}

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 Reported by: {report.submitterEmail}</p>
                    {report.submitterName && (
                      <p>👤 Name: {report.submitterName}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Reported: {formatDate(report.createdAt)}
                    </p>
                    {report.resolution && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <strong>Resolution:</strong> {report.resolution}
                      </div>
                    )}
                  </div>
                </div>

                {report.status === ReportStatus.PENDING && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(report, "RESOLVE")}
                      disabled={processing !== null}
                    >
                      ✓ Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(report, "DISMISS")}
                      disabled={processing !== null}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ✗ Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {action === "RESOLVE" ? "Resolve Issue" : "Dismiss Issue"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-900 font-medium mb-2">
                  Entity: {selectedReport.entity?.name || `ID: ${selectedReport.entityId}`}
                </p>
                <p className="text-sm text-gray-600">
                  {action === "RESOLVE"
                    ? "Please describe how this issue was resolved."
                    : "Please explain why this issue is being dismissed."}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={action === "RESOLVE" ? "How was this issue resolved?" : "Why is this being dismissed?"}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReport(null);
                    setAction(null);
                    setResolution("");
                    setError(null);
                  }}
                  disabled={processing !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={processing !== null || !resolution.trim()}
                  className={action === "DISMISS" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {processing ? "Processing..." : action === "RESOLVE" ? "Resolve" : "Dismiss"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

