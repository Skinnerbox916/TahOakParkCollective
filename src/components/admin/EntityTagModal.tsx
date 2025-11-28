"use client";

import { useState, useEffect } from "react";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TagSelector } from "@/components/tags/TagSelector";
import Link from "next/link";

interface EntityTagModalProps {
  entity: EntityWithRelations | null;
  onClose: () => void;
  onTagChange: (entityId: string) => Promise<void>;
}

export function EntityTagModal({ entity, onClose, onTagChange }: EntityTagModalProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (entity) {
      const tagIds = (entity.tags as EntityTagWithTag[] || []).map(et => et.tag.id);
      setSelectedTagIds(tagIds);
      setInitialTagIds(tagIds);
      setError(null);
    }
  }, [entity]);

  if (!entity) return null;

  const hasChanges = JSON.stringify([...selectedTagIds].sort()) !== JSON.stringify([...initialTagIds].sort());

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const added = selectedTagIds.filter(id => !initialTagIds.includes(id));
      const removed = initialTagIds.filter(id => !selectedTagIds.includes(id));

      // Add new tags
      for (const tagId of added) {
        const res = await fetch(`/api/entities/${entity.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add tag");
        }
      }

      // Remove tags
      for (const tagId of removed) {
        const res = await fetch(`/api/entities/${entity.id}/tags?tagId=${tagId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to remove tag");
        }
      }

      // Refresh entity data
      await onTagChange(entity.id);
      onClose();
    } catch (err) {
      console.error("Error updating tags:", err);
      setError(err instanceof Error ? err.message : "Failed to update tags");
    } finally {
      setLoading(false);
    }
  };

  const currentTags = (entity.tags as EntityTagWithTag[] || []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Manage Tags</h2>
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
                href={`/entities/${entity.slug}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
                target="_blank"
              >
                {entity.name} →
              </Link>
            </div>

            {/* Current Tags Summary */}
            {currentTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Tags ({currentTags.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentTags.map((et) => (
                    <span
                      key={et.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {et.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tag Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Tags
            </label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
            <p className="mt-3 text-xs text-gray-500">
              Identity tags apply immediately. Friendliness tags require admin verification.
            </p>
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
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}



