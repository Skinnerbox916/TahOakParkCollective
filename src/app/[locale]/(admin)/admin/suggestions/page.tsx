"use client";

import { useState, useEffect } from "react";
import { SuggestionStatus } from "@/lib/prismaEnums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";

interface EntitySuggestion {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  submitterEmail: string;
  submitterName: string | null;
  status: SuggestionStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EntitySuggestion | null>(null);
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus>(SuggestionStatus.PENDING);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [createEntity, setCreateEntity] = useState(true);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/suggestions?status=${statusFilter}`
      );
      const data: ApiResponse<EntitySuggestion[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setSuggestions(data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter]);

  const handleReview = async (suggestionId: string, action: "APPROVE" | "REJECT", notes?: string, createEntity: boolean = true) => {
    try {
      setProcessing(suggestionId);
      setError(null);

      const response = await fetch(`/api/admin/suggestions/${suggestionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || undefined, createEntity: action === "APPROVE" ? createEntity : undefined }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process suggestion");
      }

      await fetchSuggestions();
      setSelectedSuggestion(null);
      setAction(null);
      setNotes("");
      setCreateEntity(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process suggestion");
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenModal = (suggestion: EntitySuggestion, actionType: "APPROVE" | "REJECT") => {
    setSelectedSuggestion(suggestion);
    setAction(actionType);
    setNotes("");
  };

  const handleSubmitAction = () => {
    if (!selectedSuggestion || !action) return;
    handleReview(selectedSuggestion.id, action, notes.trim() || undefined, createEntity);
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
        <h1 className="text-3xl font-bold text-gray-900">Entity Suggestions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and approve or reject entity suggestions from the community.
        </p>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SuggestionStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={SuggestionStatus.PENDING}>Pending</option>
            <option value={SuggestionStatus.APPROVED}>Approved</option>
            <option value={SuggestionStatus.REJECTED}>Rejected</option>
          </select>
          <Button variant="outline" onClick={fetchSuggestions} disabled={loading}>
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
            <p className="text-gray-500">Loading suggestions...</p>
          </div>
        </Card>
      ) : suggestions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No suggestions found
            </h3>
            <p className="text-gray-600">
              All suggestions have been reviewed.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {suggestion.name}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        suggestion.status === SuggestionStatus.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          : suggestion.status === SuggestionStatus.APPROVED
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {suggestion.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {suggestion.description && (
                      <p>{suggestion.description}</p>
                    )}
                    {suggestion.address && (
                      <p>📍 {suggestion.address}</p>
                    )}
                    {suggestion.website && (
                      <p>
                        🌐{" "}
                        <a
                          href={suggestion.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {suggestion.website}
                        </a>
                      </p>
                    )}
                    <p>📧 Submitted by: {suggestion.submitterEmail}</p>
                    {suggestion.submitterName && (
                      <p>👤 Name: {suggestion.submitterName}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Submitted: {formatDate(suggestion.createdAt)}
                    </p>
                  </div>
                </div>

                {suggestion.status === SuggestionStatus.PENDING && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(suggestion, "APPROVE")}
                      disabled={processing !== null}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(suggestion, "REJECT")}
                      disabled={processing !== null}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedSuggestion && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {action === "APPROVE" ? "Approve Suggestion" : "Reject Suggestion"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-900 font-medium mb-2">
                  Entity: {selectedSuggestion.name}
                </p>
                {action === "APPROVE" && (
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createEntity}
                        onChange={(e) => setCreateEntity(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        Create entity in directory
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Uncheck to approve without creating the entity
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  {action === "APPROVE"
                    ? createEntity
                      ? "This will create a new entity in the directory."
                      : "This will mark the suggestion as approved without creating an entity."
                    : "This will reject the suggestion and it will not be added to the directory."}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add any notes about this decision..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSuggestion(null);
                    setAction(null);
                    setNotes("");
                    setError(null);
                  }}
                  disabled={processing !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={processing !== null}
                  className={action === "REJECT" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {processing ? "Processing..." : action === "APPROVE" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

