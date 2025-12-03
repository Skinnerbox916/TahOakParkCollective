"use client";

import { useEffect, useState } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterBar } from "@/components/admin/FilterBar";
import { ApiResponse } from "@/types";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";
import { useAdminTranslations } from "@/lib/admin-translations";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  roles: Role[];
  createdAt?: Date; // Optional since User model doesn't have this field
  businessCount: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { t, tRole } = useAdminTranslations("users");
  const { t: tCommon } = useAdminTranslations("common");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (roleFilter) params.set("role", roleFilter);
        if (searchQuery) params.set("search", searchQuery);

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data: ApiResponse<User[]> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch users");
        }

        setUsers(data.data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [roleFilter, searchQuery]);

  const handleRoleChange = async (userId: string, roles: Role[]) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });

      const data: ApiResponse<User> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update roles");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data.data! : u))
      );
    } catch (err) {
      console.error("Error updating roles:", err);
      throw err;
    }
  };

  return (
    <div>
      <PageHeader title={t("title")} />

      {/* Filters */}
      <FilterBar
        onClear={() => {
          setSearchQuery("");
          setRoleFilter("");
        }}
      >
        <Input
          type="text"
          placeholder={tCommon("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "")}
        >
          <option value="">{tCommon("allRoles")}</option>
          <option value={ROLE.USER}>{tRole(ROLE.USER)}</option>
          <option value={ROLE.ENTITY_OWNER}>{tRole(ROLE.ENTITY_OWNER)}</option>
          <option value={ROLE.ADMIN}>{tRole(ROLE.ADMIN)}</option>
        </Select>
      </FilterBar>

      {/* Error State */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingState message={t("loading")} />
      ) : (
        <Card padding="none">
          <UserTable users={users} onRoleChange={handleRoleChange} />
        </Card>
      )}
    </div>
  );
}
