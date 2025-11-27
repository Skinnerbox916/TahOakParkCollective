"use client";

import { useState, useEffect } from "react";
import { PendingChangesTable } from "@/components/admin/PendingChangesTable";
import { ChangeReviewModal } from "@/components/admin/ChangeReviewModal";
import { PendingChangeWithEntity, ApiResponse } from "@/types";
import { ChangeStatus } from "@/lib/prismaEnums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminPendingChangesPage() {
  const [changes, setChanges] = useState<PendingChangeWithEntity[]>([]);
  const [selectedChange, setSelectedChange] = useState<PendingChangeWithEntity | null>(null);
  const [statusFilter, setStatusFilter] = useState<ChangeStatus>(ChangeStatus.PENDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/pending-changes?status=${statusFilter}`
      );
      const data: ApiResponse<PendingChangeWithEntity[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch pending changes");
      }

      setChanges(data.data || []);
    } catch (err) {
      console.error("Error fetching pending changes:", err);
      setError(err instanceof Error ? err.message : "Failed to load pending changes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [statusFilter]);

  const handleReview = async (changeId: string, action: "APPROVE" | "REJECT", notes?: string) => {
    try {
      const response = await fetch(`/api/admin/pending-changes/${changeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process change");
      }

      // Refresh the list
      await fetchChanges();
      setSelectedChange(null);
    } catch (err) {
      throw err; // Let modal handle the error display
    }
  };

  const pendingCount = changes.filter((c) => c.status === ChangeStatus.PENDING).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Changes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and approve or reject changes submitted by entity owners and public users.
        </p>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChangeStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={ChangeStatus.PENDING}>
              Pending ({pendingCount})
            </option>
            <option value={ChangeStatus.APPROVED}>Approved</option>
            <option value={ChangeStatus.REJECTED}>Rejected</option>
          </select>
          <Button variant="outline" onClick={fetchChanges} disabled={loading}>
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
            <p className="text-gray-500">Loading pending changes...</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <PendingChangesTable
            changes={changes}
            onReview={(change) => setSelectedChange(change)}
          />
        </Card>
      )}

      {/* Review Modal */}
      <ChangeReviewModal
        change={selectedChange}
        onClose={() => setSelectedChange(null)}
        onReview={handleReview}
      />
    </div>
  );
}

