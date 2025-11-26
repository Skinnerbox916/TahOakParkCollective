"use client";

import { useState } from "react";
import { PendingChangeWithEntity } from "@/types";
import { ChangeType } from "@/lib/prismaEnums";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface ChangeReviewModalProps {
  change: PendingChangeWithEntity | null;
  onClose: () => void;
  onReview: (changeId: string, action: "APPROVE" | "REJECT", notes?: string) => Promise<void>;
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  CREATE_ENTITY: "Create Entity",
  UPDATE_ENTITY: "Update Entity",
  ADD_TAG: "Add Tag",
  REMOVE_TAG: "Remove Tag",
  UPDATE_IMAGE: "Update Image",
};

export function ChangeReviewModal({ change, onClose, onReview }: ChangeReviewModalProps) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!change) return null;

  const handleSubmit = async () => {
    if (!action) {
      setError("Please select an action");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onReview(change.id, action, notes.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process change");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (value.tagId) return `Tag ID: ${value.tagId}`;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Review Change</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {/* Entity Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity
              </label>
              <Link
                href={`/entities/${change.entity.slug}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
                target="_blank"
              >
                {change.entity.name} →
              </Link>
            </div>

            {/* Change Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Type
              </label>
              <p className="text-gray-900">{CHANGE_TYPE_LABELS[change.changeType]}</p>
            </div>

            {/* Field Name */}
            {change.fieldName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field
                </label>
                <p className="text-gray-900">{change.fieldName}</p>
              </div>
            )}

            {/* Old Value */}
            {change.oldValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Value
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {formatValue(change.oldValue)}
                  </pre>
                </div>
              </div>
            )}

            {/* New Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Value
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {formatValue(change.newValue)}
                </pre>
              </div>
            </div>

            {/* Submission Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitted
                </label>
                <p className="text-sm text-gray-600">{formatDate(change.createdAt)}</p>
              </div>
              {change.submitterEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitter Email
                  </label>
                  <p className="text-sm text-gray-600">{change.submitterEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAction("APPROVE")}
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  action === "APPROVE"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">✓ Approve</div>
                <div className="text-xs mt-1">Apply this change</div>
              </button>
              <button
                type="button"
                onClick={() => setAction("REJECT")}
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  action === "REJECT"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">✗ Reject</div>
                <div className="text-xs mt-1">Do not apply this change</div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add any notes about this decision..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !action}
              className={action === "REJECT" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading
                ? "Processing..."
                : action === "APPROVE"
                ? "Approve Change"
                : action === "REJECT"
                ? "Reject Change"
                : "Submit"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

