"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";

interface Stats {
  businesses: {
    total: number;
    active: number;
    pending: number;
    inactive: number;
  };
  users: {
    total: number;
    user: number;
    businessOwner: number;
    admin: number;
  };
  pendingApprovals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        const data: ApiResponse<Stats> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch statistics");
        }

        setStats(data.data!);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <Card>
          <p className="text-red-600">{error || "Failed to load statistics"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Quick Actions */}
      {stats.pendingApprovals > 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {stats.pendingApprovals} Pending Approval{stats.pendingApprovals !== 1 ? "s" : ""}
              </h2>
              <p className="text-sm text-gray-600">
                Review and approve pending entity listings
              </p>
            </div>
            <Button href="/admin/entities?status=PENDING">
              Review Pending
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Businesses */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Businesses</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.businesses.total}</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="font-medium text-green-600">{stats.businesses.active}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">{stats.businesses.pending}</span>
            </div>
            <div className="flex justify-between">
              <span>Inactive:</span>
              <span className="font-medium text-gray-600">{stats.businesses.inactive}</span>
            </div>
          </div>
        </Card>

        {/* Total Users */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Users:</span>
              <span className="font-medium">{stats.users.user}</span>
            </div>
            <div className="flex justify-between">
              <span>Business Owners:</span>
              <span className="font-medium">{stats.users.businessOwner}</span>
            </div>
            <div className="flex justify-between">
              <span>Admins:</span>
              <span className="font-medium">{stats.users.admin}</span>
            </div>
          </div>
        </Card>

        {/* Active Businesses */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Businesses</h3>
          <p className="text-3xl font-bold text-green-600">{stats.businesses.active}</p>
          <Link
            href="/admin/entities?status=ACTIVE"
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
          >
            View all →
          </Link>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
          <Link
            href="/admin/entities?status=PENDING"
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
          >
            Review now →
          </Link>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/admin/entities" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">Manage Entities</h3>
            <p className="text-sm text-gray-600">View, edit, and approve entity listings</p>
          </Link>
        </Card>
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/admin/users" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">Manage Users</h3>
            <p className="text-sm text-gray-600">View users and manage roles</p>
          </Link>
        </Card>
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">View Directory</h3>
            <p className="text-sm text-gray-600">See the public-facing directory</p>
          </Link>
        </Card>
      </div>
    </div>
  );
}
