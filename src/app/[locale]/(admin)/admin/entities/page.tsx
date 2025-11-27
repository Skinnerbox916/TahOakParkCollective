"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EntityTable } from "@/components/admin/EntityTable";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EntityWithRelations, ApiResponse } from "@/types";
import { BUSINESS_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import type { BusinessStatus, EntityType } from "@/lib/prismaEnums";
import type { Category } from "@/types";
import { ENTITY_TYPES } from "@/lib/constants";

function AdminEntitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "">(
    (searchParams.get("status") as BusinessStatus) || ""
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "");
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | "">(
    (searchParams.get("entityType") as EntityType) || ""
  );

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

  const handleStatusChange = async (entityId: string, newStatus: BusinessStatus) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
        <Button href="/admin/entities/new">
          Add New Entity
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search entities..."
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
              onChange={(e) => setStatusFilter(e.target.value as BusinessStatus | "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value={BUSINESS_STATUS.ACTIVE}>Active</option>
              <option value={BUSINESS_STATUS.PENDING}>Pending</option>
              <option value={BUSINESS_STATUS.INACTIVE}>Inactive</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
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
              <option value="">All Types</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button onClick={handleFilterChange} className="w-full">
              Apply Filters
            </Button>
          </div>
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
            <p className="text-gray-500">Loading entities...</p>
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
          />
        </Card>
      )}
    </div>
  );
}

export default function AdminEntities() {
  return (
    <Suspense fallback={
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        </Card>
      </div>
    }>
      <AdminEntitiesContent />
    </Suspense>
  );
}

