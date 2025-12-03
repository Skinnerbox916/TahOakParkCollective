"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/IconButton";
import { KebabIcon } from "@/components/ui/KebabIcon";
import { SortableTableHeader } from "./SortableTableHeader";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import type { EntityStatus } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";
import { formatPhoneNumber, cn } from "@/lib/utils";
import { ENTITY_TYPES } from "@/lib/constants";
import { useAdminTranslations } from "@/lib/admin-translations";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import { TagBadge } from "@/components/tags/TagBadge";

interface EntityTableProps {
  entities: EntityWithRelations[];
  onStatusChange?: (entityId: string, newStatus: EntityStatus) => Promise<void>;
  onDelete?: (entityId: string) => Promise<void>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (sortKey: string) => void;
}

export function EntityTable({ 
  entities, 
  onStatusChange, 
  onDelete,
  sortBy,
  sortOrder,
  onSort
}: EntityTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { t: tEntities, tStatus } = useAdminTranslations("entities");
  const tCommon = useTranslations("common");
  const entityTypeLabels = useEntityTypeLabels();

  const handleStatusChange = async (entityId: string, newStatus: EntityStatus) => {
    if (!onStatusChange) return;
    
    setUpdating(entityId);
    try {
      await onStatusChange(entityId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(tEntities("alerts.statusError"));
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (entityId: string) => {
    if (!onDelete) return;
    
    if (!confirm(tEntities("alerts.deleteConfirm"))) {
      return;
    }

    setDeleting(entityId);
    try {
      await onDelete(entityId);
    } catch (error) {
      console.error("Error deleting entity:", error);
      alert(tEntities("alerts.deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  if (entities.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title={tEntities("noEntities")}
        description={tEntities("noEntitiesDescription") || "Try adjusting your filters"}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onSort ? (
              <SortableTableHeader
                label={tEntities("columns.name")}
                sortKey="name"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
            ) : (
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tEntities("columns.name")}
              </th>
            )}
            {onSort ? (
              <SortableTableHeader
                label={tEntities("columns.type")}
                sortKey="entityType"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="hidden lg:table-cell"
              />
            ) : (
              <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tEntities("columns.type")}
              </th>
            )}
            <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.category")}
            </th>
            {onSort ? (
              <SortableTableHeader
                label={tEntities("columns.status")}
                sortKey="status"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
              />
            ) : (
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tEntities("columns.status")}
              </th>
            )}
            {onSort ? (
              <SortableTableHeader
                label={tEntities("columns.owner")}
                sortKey="owner"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="hidden lg:table-cell"
              />
            ) : (
              <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tEntities("columns.owner")}
              </th>
            )}
            {onSort ? (
              <SortableTableHeader
                label={tEntities("columns.created")}
                sortKey="createdAt"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="hidden xl:table-cell"
              />
            ) : (
              <th className="hidden xl:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tEntities("columns.created")}
              </th>
            )}
            <th className="px-3 lg:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entities.map((entity) => (
            <tr key={entity.id} className="hover:bg-gray-50">
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
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
              <td className="hidden lg:table-cell px-3 lg:px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-700">
                  {entityTypeLabels[entity.entityType as EntityType]}
                </span>
              </td>
              <td className="hidden lg:table-cell px-3 lg:px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {entity.categories && entity.categories.length > 0
                    ? entity.categories.map((cat: any) => cat.name).join(", ")
                    : "—"}
                </span>
              </td>
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                {onStatusChange ? (
                  <div className="flex flex-col items-start gap-1">
                    <button
                      onClick={() => {
                        const newStatus = entity.status === ENTITY_STATUS.ACTIVE 
                          ? ENTITY_STATUS.INACTIVE 
                          : ENTITY_STATUS.ACTIVE;
                        handleStatusChange(entity.id, newStatus);
                      }}
                      disabled={updating === entity.id}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        entity.status === ENTITY_STATUS.ACTIVE ? "bg-green-600" : "bg-gray-300",
                        updating === entity.id && "opacity-50 cursor-not-allowed"
                      )}
                      title={entity.status === ENTITY_STATUS.ACTIVE ? "Click to deactivate" : "Click to activate"}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          entity.status === ENTITY_STATUS.ACTIVE ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                    <span className={cn(
                      "text-xs font-medium",
                      entity.status === ENTITY_STATUS.ACTIVE ? "text-green-700" : "text-gray-500"
                    )}>
                      {entity.status === ENTITY_STATUS.ACTIVE ? "Active" : "Inactive"}
                    </span>
                  </div>
                ) : (
                  <StatusBadge status={entity.status} />
                )}
              </td>
              <td className="hidden lg:table-cell px-3 lg:px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {entity.owner?.name || entity.owner?.email || "—"}
                </div>
                {entity.phone && (
                  <div className="text-xs text-gray-500">
                    {formatPhoneNumber(entity.phone)}
                  </div>
                )}
              </td>
              <td className="hidden xl:table-cell px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {new Date(entity.createdAt).toLocaleDateString()}
              </td>
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <Dropdown
                  align="right"
                  trigger={
                    <IconButton
                      icon={<KebabIcon className="w-5 h-5" />}
                      size="sm"
                      variant="ghost"
                      aria-label={tEntities("actions.menu") || "Actions"}
                    />
                  }
                >
                  <Link
                    href={`/admin/entities/${entity.id}`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    href={`/admin/entities/${entity.id}/edit`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Edit Entity
                  </Link>
                  {onDelete && (
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => handleDelete(entity.id)}
                        disabled={deleting === entity.id}
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors",
                          deleting === entity.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {deleting === entity.id
                          ? tEntities("actions.deleting")
                          : tEntities("actions.delete")}
                      </button>
                    </div>
                  )}
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

