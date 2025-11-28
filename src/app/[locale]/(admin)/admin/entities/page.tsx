"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityTagModal } from "@/components/admin/EntityTagModal";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EntityWithRelations, ApiResponse } from "@/types";
import { ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import type { Category } from "@/types";
import { ENTITY_TYPES } from "@/lib/constants";
import { useAdminTranslations } from "@/lib/admin-translations";
import { useTranslations } from "next-intl";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";

function AdminEntitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityWithRelations | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "">(
    (searchParams.get("status") as EntityStatus) || ""
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "");
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "">(
    (searchParams.get("entityType") as EntityType) || ""
  );
  const { t: tEntities, tStatus } = useAdminTranslations("entities");
  const tCommon = useTranslations("common");
  const entityTypeLabels = useEntityTypeLabels();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        const data: ApiResponse<Category[]> = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchEntities() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (searchQuery) params.set("search", searchQuery);
        if (categoryFilter) params.set("categoryId", categoryFilter);
        if (entityTypeFilter) params.set("entityType", entityTypeFilter);

        const response = await fetch(`/api/admin/entities?${params.toString()}`);
        const data: ApiResponse<EntityWithRelations[]> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch entities");
        }

        setEntities(data.data || []);
      } catch (err) {
        console.error("Error fetching entities:", err);
        setError(err instanceof Error ? err.message : "Failed to load entities");
      } finally {
        setLoading(false);
      }
    }

    fetchEntities();
  }, [statusFilter, searchQuery, categoryFilter, entityTypeFilter]);

  const handleStatusChange = async (entityId: string, newStatus: EntityStatus) => {
    try {
      const response = await fetch("/api/admin/entities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entityId, status: newStatus }),
      });

      const data: ApiResponse<EntityWithRelations> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      // Update local state
      setEntities((prev) =>
        prev.map((e) => (e.id === entityId ? data.data! : e))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    }
  };

  const handleFeaturedChange = async (entityId: string, featured: boolean) => {
    try {
      const response = await fetch("/api/admin/entities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entityId, featured }),
      });

      const data: ApiResponse<EntityWithRelations> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update featured status");
      }

      // Update local state
      setEntities((prev) =>
        prev.map((e) => (e.id === entityId ? data.data! : e))
      );
    } catch (err) {
      console.error("Error updating featured status:", err);
      throw err;
    }
  };

  const handleEntityTypeChange = async (entityId: string, entityType: EntityType) => {
    try {
      const response = await fetch("/api/admin/entities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entityId, entityType }),
      });

      const data: ApiResponse<EntityWithRelations> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update entity type");
      }

      // Update local state
      setEntities((prev) =>
        prev.map((e) => (e.id === entityId ? data.data! : e))
      );
    } catch (err) {
      console.error("Error updating entity type:", err);
      throw err;
    }
  };

  const handleDelete = async (entityId: string) => {
    try {
      const response = await fetch(`/api/entities/${entityId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete entity");
      }

      // Remove from local state
      setEntities((prev) => prev.filter((e) => e.id !== entityId));
    } catch (err) {
      console.error("Error deleting entity:", err);
      throw err;
    }
  };

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    router.push(`/admin/entities?${params.toString()}`);
  };

  const handleTagManage = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    setSelectedEntity(entity || null);
  };

  const handleTagChange = async (entityId: string) => {
    try {
      // Refresh the entity data from the API
      const response = await fetch(`/api/admin/entities?status=${statusFilter || ""}&search=${searchQuery || ""}&categoryId=${categoryFilter || ""}&entityType=${entityTypeFilter || ""}`);
      const data: ApiResponse<EntityWithRelations[]> = await response.json();

      if (response.ok && data.success && data.data) {
        setEntities(data.data);
        // Update selected entity if modal is open
        if (selectedEntity) {
          const updatedEntity = data.data.find((e) => e.id === entityId);
          if (updatedEntity) {
            setSelectedEntity(updatedEntity);
          }
        }
      }
    } catch (err) {
      console.error("Error refreshing entity data:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{tEntities("page.title")}</h1>
        <Button href="/admin/entities/new">
          {tEntities("page.addButton")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Input
              type="text"
              placeholder={tEntities("page.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFilterChange();
                }
              }}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EntityStatus | "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{tEntities("page.allStatuses")}</option>
              <option value={ENTITY_STATUS.ACTIVE}>{tStatus(ENTITY_STATUS.ACTIVE)}</option>
              <option value={ENTITY_STATUS.PENDING}>{tStatus(ENTITY_STATUS.PENDING)}</option>
              <option value={ENTITY_STATUS.INACTIVE}>{tStatus(ENTITY_STATUS.INACTIVE)}</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{tEntities("page.allCategories")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{tEntities("page.allTypes")}</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {entityTypeLabels[type.value as EntityType]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button onClick={handleFilterChange} className="w-full">
              {tEntities("page.applyFilters")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error || tEntities("page.errorLoading")}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{tEntities("page.loading")}</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <EntityTable
            entities={entities}
            onStatusChange={handleStatusChange}
            onFeaturedChange={handleFeaturedChange}
            onEntityTypeChange={handleEntityTypeChange}
            onDelete={handleDelete}
            onTagManage={handleTagManage}
          />
        </Card>
      )}

      {/* Tag Management Modal */}
      <EntityTagModal
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onTagChange={handleTagChange}
      />
    </div>
  );
}

export default function AdminEntities() {
  const { t: tEntities } = useAdminTranslations("entities");
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{tEntities("page.title")}</h1>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{tCommon("loading")}</p>
          </div>
        </Card>
      </div>
    }>
      <AdminEntitiesContent />
    </Suspense>
  );
}

