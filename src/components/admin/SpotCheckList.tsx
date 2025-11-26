"use client";

import { EntityWithRelations, ApiResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface SpotCheckListProps {
  entities: EntityWithRelations[];
  onMarkChecked: (entityId: string) => Promise<void>;
  loading?: boolean;
}

export function SpotCheckList({ entities, onMarkChecked, loading }: SpotCheckListProps) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All entities are up to date
        </h3>
        <p className="text-gray-600">
          All active entities have been spot checked recently.
        </p>
      </div>
    );
  }

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysAgo = (date: Date | string | null): string => {
    if (!date) return "Never checked";
    const daysAgo = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 30) return `${daysAgo} days ago`;
    if (daysAgo < 365) {
      const months = Math.floor(daysAgo / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(daysAgo / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  };

  const getStatusColor = (date: Date | string | null): string => {
    if (!date) return "bg-red-100 text-red-800";
    const daysAgo = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo < 30) return "bg-green-100 text-green-800";
    if (daysAgo < 180) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <Card key={entity.id} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/entities/${entity.slug}`}
                  className="text-lg font-semibold text-indigo-600 hover:text-indigo-800"
                  target="_blank"
                >
                  {entity.name}
                </Link>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    entity.spotCheckDate
                  )}`}
                >
                  {getDaysAgo(entity.spotCheckDate)}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                {entity.address && (
                  <div>📍 {entity.address}</div>
                )}
                {entity.phone && (
                  <div>📞 {entity.phone}</div>
                )}
                {entity.website && (
                  <div>
                    🌐{" "}
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {entity.website}
                    </a>
                  </div>
                )}
                {entity.owner && (
                  <div>👤 Owner: {entity.owner.name || entity.owner.email}</div>
                )}
              </div>

              {entity.spotCheckDate && (
                <div className="mt-2 text-xs text-gray-500">
                  Last checked: {formatDate(entity.spotCheckDate)}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkChecked(entity.id)}
                disabled={loading}
              >
                ✓ Mark as Checked
              </Button>
              <Link
                href={`/admin/entities/${entity.id}`}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Edit Entity →
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

