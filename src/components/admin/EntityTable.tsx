"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";
import { formatPhoneNumber, cn } from "@/lib/utils";
import { ENTITY_TYPES } from "@/lib/constants";
import { useAdminTranslations } from "@/lib/admin-translations";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";

interface EntityTableProps {
  entities: EntityWithRelations[];
  onStatusChange?: (entityId: string, newStatus: EntityStatus) => Promise<void>;
  onFeaturedChange?: (entityId: string, featured: boolean) => Promise<void>;
  onEntityTypeChange?: (entityId: string, entityType: EntityType) => Promise<void>;
  onDelete?: (entityId: string) => Promise<void>;
  onTagManage?: (entityId: string) => void;
}

export function EntityTable({ entities, onStatusChange, onFeaturedChange, onEntityTypeChange, onDelete, onTagManage }: EntityTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [updatingEntityType, setUpdatingEntityType] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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

  const handleFeaturedToggle = async (entityId: string, currentFeatured: boolean) => {
    if (!onFeaturedChange) return;
    
    setTogglingFeatured(entityId);
    try {
      await onFeaturedChange(entityId, !currentFeatured);
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert(tEntities("alerts.featuredError"));
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
      alert(tEntities("alerts.typeError"));
    } finally {
      setUpdatingEntityType(null);
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
      <div className="text-center py-12">
        <p className="text-gray-500">{tEntities("noEntities")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.name")}
            </th>
            <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.type")}
            </th>
            <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.category")}
            </th>
            <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.tags")}
            </th>
            <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.status")}
            </th>
            <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.featured")}
            </th>
            <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.owner")}
            </th>
            <th className="hidden xl:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {tEntities("columns.created")}
            </th>
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
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                {onEntityTypeChange ? (
                  <select
                    value={entity.entityType}
                    onChange={(e) => handleEntityTypeChange(entity.id, e.target.value as EntityType)}
                    disabled={updatingEntityType === entity.id}
                    className={cn(
                      "text-xs border border-gray-300 rounded px-2 py-1 focus-ring min-w-[140px]",
                      updatingEntityType === entity.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {entityTypeLabels[type.value as EntityType]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-700">
                    {entityTypeLabels[entity.entityType as EntityType]}
                  </span>
                )}
              </td>
              <td className="hidden lg:table-cell px-3 lg:px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {entity.category?.name || "—"}
                </span>
              </td>
              <td className="hidden lg:table-cell px-3 lg:px-4 py-3">
                {(() => {
                  const tags = (entity.tags as EntityTagWithTag[] || []);
                  if (tags.length === 0) {
                    return <span className="text-sm text-gray-500">—</span>;
                  }
                  if (tags.length <= 2) {
                    return (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((et) => (
                          <span
                            key={et.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {et.tag.name}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <span className="text-sm text-gray-700">
                      {tags.slice(0, 2).map((et) => et.tag.name).join(", ")} +{tags.length - 2}
                    </span>
                  );
                })()}
              </td>
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                <StatusBadge status={entity.status} />
              </td>
              <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                {onFeaturedChange ? (
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entity.featured || false}
                      onChange={() => handleFeaturedToggle(entity.id, entity.featured || false)}
                      disabled={togglingFeatured === entity.id}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus-ring"
                    />
                  </label>
                ) : (
                  <span className="text-sm text-gray-700">
                    {entity.featured ? tCommon("yes") : tCommon("no")}
                  </span>
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
                {entity.status === ENTITY_STATUS.PENDING && onStatusChange ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(entity.id, ENTITY_STATUS.ACTIVE)}
                      disabled={updating === entity.id}
                    >
                      {updating === entity.id ? tCommon("loading") : tEntities("actions.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusChange(entity.id, ENTITY_STATUS.INACTIVE)}
                      disabled={updating === entity.id}
                    >
                      {updating === entity.id ? tCommon("loading") : tEntities("actions.reject")}
                    </Button>
                  </div>
                ) : (
                  <Dropdown
                    align="right"
                    trigger={
                      <Button size="sm" variant="outline">
                        {tEntities("actions.menu")}
                      </Button>
                    }
                    onOpenChange={(open) => setOpenDropdown(open ? entity.id : null)}
                  >
                    {entity.status !== ENTITY_STATUS.PENDING && onStatusChange && (
                      <div className="py-1">
                        <label className="block px-4 py-2 text-sm text-gray-700">
                          <span className="block mb-1">
                            {tEntities("dropdown.statusLabel")}
                          </span>
                          <select
                            value={entity.status}
                            onChange={(e) => {
                              handleStatusChange(entity.id, e.target.value as EntityStatus);
                              setOpenDropdown(null);
                            }}
                            disabled={updating === entity.id}
                            className={cn(
                              "w-full text-xs border border-gray-300 rounded px-2 py-1 focus-ring",
                              updating === entity.id && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <option value={ENTITY_STATUS.ACTIVE}>
                              {tStatus(ENTITY_STATUS.ACTIVE)}
                            </option>
                            <option value={ENTITY_STATUS.PENDING}>
                              {tStatus(ENTITY_STATUS.PENDING)}
                            </option>
                            <option value={ENTITY_STATUS.INACTIVE}>
                              {tStatus(ENTITY_STATUS.INACTIVE)}
                            </option>
                          </select>
                        </label>
                      </div>
                    )}
                    {onTagManage && (
                      <button
                        onClick={() => {
                          onTagManage(entity.id);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {tEntities("actions.manageTags")}
                      </button>
                    )}
                    {onDelete && (
                      <div className="border-t border-gray-200 py-1">
                        <button
                          onClick={() => {
                            handleDelete(entity.id);
                            setOpenDropdown(null);
                          }}
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
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

