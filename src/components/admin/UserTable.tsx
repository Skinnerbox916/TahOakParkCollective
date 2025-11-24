"use client";

import { useState } from "react";
import { RoleBadges } from "./RoleBadge";
import { Button } from "@/components/ui/Button";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";
import { ApiResponse } from "@/types";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  roles: Role[];
  createdAt?: Date; // Optional since User model doesn't have this field
  businessCount: number;
}

interface UserTableProps {
  users: User[];
  onRoleChange?: (userId: string, roles: Role[]) => Promise<void>;
}

export function UserTable({ users, onRoleChange }: UserTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<Role[]>([]);

  const handleEditClick = (user: User) => {
    setEditingUser(user.id);
    setEditingRoles([...user.roles]);
  };

  const handleRoleToggle = (role: Role) => {
    if (role === ROLE.USER) {
      // USER role cannot be removed
      return;
    }
    if (editingRoles.includes(role)) {
      setEditingRoles(editingRoles.filter((r) => r !== role));
    } else {
      setEditingRoles([...editingRoles, role]);
    }
  };

  const handleSave = async (userId: string) => {
    if (!onRoleChange) return;

    const user = users.find((u) => u.id === userId);
    const hadAdmin = user?.roles.includes(ROLE.ADMIN) ?? false;
    const willHaveAdmin = editingRoles.includes(ROLE.ADMIN);

    // Confirmation for admin promotions
    if (!hadAdmin && willHaveAdmin) {
      if (!confirm("Are you sure you want to promote this user to Admin? They will have full access to the system.")) {
        return;
      }
    }

    // Confirmation for admin demotions
    if (hadAdmin && !willHaveAdmin) {
      if (!confirm("Are you sure you want to remove admin privileges from this user?")) {
        return;
      }
    }

    setUpdating(userId);
    try {
      await onRoleChange(userId, editingRoles);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating roles:", error);
      alert("Failed to update user roles");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditingRoles([]);
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No users found</p>
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
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roles
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Businesses
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
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || "—"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.email || "—"}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingUser === user.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      {Object.values(ROLE).map((role) => (
                        <label
                          key={role}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={editingRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            disabled={role === ROLE.USER || updating === user.id}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={role === ROLE.USER ? "text-gray-400" : ""}>
                            {role === ROLE.USER ? "User (required)" : role.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={updating === user.id}
                        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={updating === user.id}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <RoleBadges roles={user.roles} />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{user.businessCount}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {onRoleChange && editingUser !== user.id && (
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Edit Roles
                  </button>
                )}
                {updating === user.id && (
                  <span className="ml-2 text-xs text-gray-500">Updating...</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

