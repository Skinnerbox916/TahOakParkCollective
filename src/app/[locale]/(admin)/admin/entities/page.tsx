"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EntityTable } from "@/components/admin/EntityTable";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { EntityWithRelations, ApiResponse } from "@/types";
import { ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import type { Category } from "@/types";
import { ENTITY_TYPES } from "@/lib/constants";
import { useAdminTranslations } from "@/lib/admin-translations";
import { useTranslations, useLocale } from "next-intl";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";

function AdminEntitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "">(
    (searchParams.get("status") as EntityStatus) || ""
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "");
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "">(
    (searchParams.get("entityType") as EntityType) || ""
  );
  
  // Sort state
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
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

  // Clear sort state when locale changes (alphabetical order differs by language)
  useEffect(() => {
    setSortBy("createdAt");
    setSortOrder("desc");
  }, [locale]);

  // Filter categories by entity type
  useEffect(() => {
    if (entityTypeFilter) {
      const filtered = categories.filter(cat => 
        cat.entityTypes && cat.entityTypes.includes(entityTypeFilter)
      );
      setFilteredCategories(filtered);
      
      // Reset category if current selection is not valid for new entity type
      if (categoryFilter) {
        const currentCategory = categories.find(c => c.id === categoryFilter);
        if (currentCategory && (!currentCategory.entityTypes || !currentCategory.entityTypes.includes(entityTypeFilter))) {
          setCategoryFilter("");
        }
      }
    } else {
      // Show all categories when no type filter is selected
      setFilteredCategories(categories);
    }
  }, [entityTypeFilter, categories, categoryFilter]);

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
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);

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
  }, [statusFilter, searchQuery, categoryFilter, entityTypeFilter, sortBy, sortOrder]);

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

  const handleSort = (sortKey: string) => {
    // Toggle sort order if clicking same column, otherwise set to ascending
    if (sortBy === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(sortKey);
      setSortOrder("asc");
    }
  };


  return (
    <div>
      <PageHeader 
        title={tEntities("page.title")}
        action={
          <Button href="/admin/entities/new">
            {tEntities("page.addButton")}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar>
        <Input
          type="text"
          placeholder={tEntities("page.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | "")}
        >
          <option value="">{tEntities("page.allTypes")}</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {entityTypeLabels[type.value as EntityType]}
            </option>
          ))}
        </Select>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">{tEntities("page.allCategories")}</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EntityStatus | "")}
        >
          <option value="">{tEntities("page.allStatuses")}</option>
          <option value={ENTITY_STATUS.ACTIVE}>{tStatus(ENTITY_STATUS.ACTIVE)}</option>
          <option value={ENTITY_STATUS.INACTIVE}>{tStatus(ENTITY_STATUS.INACTIVE)}</option>
        </Select>
      </FilterBar>

      {/* Error State */}
      {error && (
        <Alert variant="error">
          {error || tEntities("page.errorLoading")}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingState message={tEntities("page.loading")} />
      ) : (
        <Card padding="none">
          <EntityTable
            entities={entities}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </Card>
      )}
    </div>
  );
}

export default function AdminEntities() {
  const { t: tEntities } = useAdminTranslations("entities");
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={
      <div>
        <PageHeader title={tEntities("page.title")} />
        <LoadingState message={tCommon("loading")} />
      </div>
    }>
      <AdminEntitiesContent />
    </Suspense>
  );
}

