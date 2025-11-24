"use client";

import { useState } from "react";
import Link from "next/link";
import { EntityWithRelations } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { BUSINESS_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { BusinessStatus, EntityType } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";
import { formatPhoneNumber } from "@/lib/utils";
import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "@/lib/constants";

interface EntityTableProps {
  entities: EntityWithRelations[];
  onStatusChange?: (entityId: string, newStatus: BusinessStatus) => Promise<void>;
  onFeaturedChange?: (entityId: string, featured: boolean) => Promise<void>;
  onEntityTypeChange?: (entityId: string, entityType: EntityType) => Promise<void>;
  onDelete?: (entityId: string) => Promise<void>;
}

export function EntityTable({ entities, onStatusChange, onFeaturedChange, onEntityTypeChange, onDelete }: EntityTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [updatingEntityType, setUpdatingEntityType] = useState<string | null>(null);

  const handleStatusChange = async (entityId: string, newStatus: BusinessStatus) => {
    if (!onStatusChange) return;
    
    setUpdating(entityId);
    try {
      await onStatusChange(entityId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update entity status");
    } finally {
      setUpdating(null);
    }
  };

  const handleFeaturedToggle = async (entityId: string, currentFeatured: boolean) => {
    if (!onFeaturedChange) return;
    
    setTogglingFeatured(entityId);
    try {
      await onFeaturedChange(entityId, !currentFeatured);
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert("Failed to update featured status");
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleEntityTypeChange = async (entityId: string, newType: EntityType) => {
    if (!onEntityTypeChange) return;
    
    setUpdatingEntityType(entityId);
    try {
      await onEntityTypeChange(entityId, newType);
    } catch (error) {
      console.error("Error updating entity type:", error);
      alert("Failed to update entity type");
    } finally {
      setUpdatingEntityType(null);
    }
  };

  const handleDelete = async (entityId: string) => {
    if (!onDelete) return;
    
    if (!confirm("Are you sure you want to delete this entity? This action cannot be undone.")) {
      return;
    }

    setDeleting(entityId);
    try {
      await onDelete(entityId);
    } catch (error) {
      console.error("Error deleting entity:", error);
      alert("Failed to delete entity");
    } finally {
      setDeleting(null);
    }
  };

  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No entities found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Featured
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entities.map((entity) => (
            <tr key={entity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <Link
                    href={`/entities/${entity.slug}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    target="_blank"
                  >
                    {entity.name}
                  </Link>
                  {entity.address && (
                    <p className="text-xs text-gray-500 mt-1">{entity.address}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {onEntityTypeChange ? (
                  <select
                    value={entity.entityType}
                    onChange={(e) => handleEntityTypeChange(entity.id, e.target.value as EntityType)}
                    disabled={updatingEntityType === entity.id}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-700">
                    {ENTITY_TYPE_LABELS[entity.entityType as EntityType]}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {entity.category?.name || "—"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={entity.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {onFeaturedChange ? (
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entity.featured || false}
                      onChange={() => handleFeaturedToggle(entity.id, entity.featured || false)}
                      disabled={togglingFeatured === entity.id}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {entity.featured ? "Featured" : "Not Featured"}
                    </span>
                  </label>
                ) : (
                  <span className="text-sm text-gray-700">
                    {entity.featured ? "Yes" : "No"}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {entity.owner?.name || entity.owner?.email || "—"}
                </div>
                {entity.phone && (
                  <div className="text-xs text-gray-500">
                    {formatPhoneNumber(entity.phone)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(entity.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {entity.status === BUSINESS_STATUS.PENDING && onStatusChange && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusChange(entity.id, BUSINESS_STATUS.ACTIVE)}
                        disabled={updating === entity.id}
                      >
                        {updating === entity.id ? "..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStatusChange(entity.id, BUSINESS_STATUS.INACTIVE)}
                        disabled={updating === entity.id}
                      >
                        {updating === entity.id ? "..." : "Reject"}
                      </Button>
                    </>
                  )}
                  {entity.status !== BUSINESS_STATUS.PENDING && onStatusChange && (
                    <select
                      value={entity.status}
                      onChange={(e) => handleStatusChange(entity.id, e.target.value as BusinessStatus)}
                      disabled={updating === entity.id}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={BUSINESS_STATUS.ACTIVE}>Active</option>
                      <option value={BUSINESS_STATUS.PENDING}>Pending</option>
                      <option value={BUSINESS_STATUS.INACTIVE}>Inactive</option>
                    </select>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(entity.id)}
                      disabled={deleting === entity.id}
                    >
                      {deleting === entity.id ? "..." : "Delete"}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

