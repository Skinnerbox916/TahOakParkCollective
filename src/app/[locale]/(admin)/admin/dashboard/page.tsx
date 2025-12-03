"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/admin/PageHeader";
import { ApiResponse } from "@/types";
import { useAdminTranslations } from "@/lib/admin-translations";

interface Stats {
  entities: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    user: number;
    entityOwner: number;
    admin: number;
  };
  pendingApprovals: number;
  pendingIssueReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t: tDashboard } = useAdminTranslations("dashboard");

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
        <PageHeader title={tDashboard("title")} />
        <LoadingState />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <PageHeader title={tDashboard("title")} />
        <Alert variant="error">
          {error || tDashboard("loadError")}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={tDashboard("title")} />

      {/* Quick Actions */}
      {stats.pendingApprovals > 0 && (
        <Alert variant="warning">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {tDashboard("pendingApprovalsHeading", { count: stats.pendingApprovals })}
              </h2>
              <p className="text-sm">
                {tDashboard("pendingDescription")}
              </p>
            </div>
            <Button href="/admin/approvals">
              {tDashboard("reviewApprovals")}
            </Button>
          </div>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Entities */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            {tDashboard("totalEntities")}
          </h3>
          <p className="text-3xl font-bold text-gray-900">{stats.entities.total}</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>{tDashboard("active")}:</span>
              <span className="font-medium text-green-600">
                {stats.entities.active}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{tDashboard("inactive")}:</span>
              <span className="font-medium text-gray-600">
                {stats.entities.inactive}
              </span>
            </div>
          </div>
        </Card>

        {/* Total Users */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            {tDashboard("totalUsers")}
          </h3>
          <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>{tDashboard("users")}:</span>
              <span className="font-medium">{stats.users.user}</span>
            </div>
            <div className="flex justify-between">
              <span>{tDashboard("entityOwners")}:</span>
              <span className="font-medium">
                {stats.users.entityOwner}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{tDashboard("admins")}:</span>
              <span className="font-medium">{stats.users.admin}</span>
            </div>
          </div>
        </Card>

        {/* Active Entities */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            {tDashboard("activeEntities")}
          </h3>
          <p className="text-3xl font-bold text-green-600">{stats.entities.active}</p>
          <Link
            href="/admin/entities?status=ACTIVE"
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
          >
            {tDashboard("viewAll")}
          </Link>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            {tDashboard("pendingApprovals")}
          </h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
          <Link
            href="/admin/approvals"
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
          >
            {tDashboard("reviewNow")}
          </Link>
        </Card>
      </div>

      {/* Quick Links */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {tDashboard("quickLinksTitle")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/admin/entities" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">
              {tDashboard("manageEntities")}
            </h3>
            <p className="text-sm text-gray-600">
              {tDashboard("manageEntitiesDescription")}
            </p>
          </Link>
        </Card>
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/admin/approvals" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">
              {tDashboard("reviewApprovals")}
            </h3>
            <p className="text-sm text-gray-600">
              {tDashboard("reviewApprovalsDescription")}
            </p>
          </Link>
        </Card>
        <Card padding="sm" className="hover:shadow-md transition-shadow">
          <Link href="/admin/users" className="block">
            <h3 className="font-semibold text-gray-900 mb-1">
              {tDashboard("manageUsers")}
            </h3>
            <p className="text-sm text-gray-600">
              {tDashboard("manageUsersDescription")}
            </p>
          </Link>
        </Card>
      </div>
    </div>
  );
}
