"use client";

import { PendingChangeWithEntity } from "@/types";
import { ChangeType, ChangeStatus } from "@/lib/prismaEnums";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PendingChangesTableProps {
  changes: PendingChangeWithEntity[];
  onReview: (change: PendingChangeWithEntity) => void;
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  CREATE_ENTITY: "Create Entity",
  UPDATE_ENTITY: "Update Entity",
  ADD_TAG: "Add Tag",
  REMOVE_TAG: "Remove Tag",
  UPDATE_IMAGE: "Update Image",
};

const STATUS_COLORS: Record<ChangeStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function PendingChangesTable({ changes, onReview }: PendingChangesTableProps) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No pending changes
        </h3>
        <p className="text-gray-600">
          All changes have been reviewed.
        </p>
      </div>
    );
  }

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
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Changes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {changes.map((change) => (
            <tr key={change.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/entities/${change.entity.slug}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {change.entity.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {CHANGE_TYPE_LABELS[change.changeType]}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {change.fieldName && (
                    <div className="font-medium mb-1">{change.fieldName}:</div>
                  )}
                  <div className="space-y-1">
                    {change.oldValue && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">From:</span>{" "}
                        {formatValue(change.oldValue)}
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="font-medium">To:</span>{" "}
                      {formatValue(change.newValue)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(change.createdAt)}
                {change.submitterEmail && (
                  <div className="text-xs text-gray-400 mt-1">
                    {change.submitterEmail}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    STATUS_COLORS[change.status]
                  }`}
                >
                  {change.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {change.status === ChangeStatus.PENDING ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReview(change)}
                  >
                    Review
                  </Button>
                ) : (
                  <span className="text-gray-400 text-xs">
                    {change.reviewedAt && formatDate(change.reviewedAt)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

