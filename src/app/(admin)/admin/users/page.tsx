"use client";

import { useEffect, useState } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Users</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" suppressHydrationWarning>
          <div>
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value={ROLE.USER}>User</option>
              <option value={ROLE.BUSINESS_OWNER}>Business Owner</option>
              <option value={ROLE.ADMIN}>Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("");
              }}
              variant="outline"
              className="w-full"
            >
              Clear Filters
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
            <p className="text-gray-500">Loading users...</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <UserTable users={users} onRoleChange={handleRoleChange} />
        </Card>
      )}
    </div>
  );
}
