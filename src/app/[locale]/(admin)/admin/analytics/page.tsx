"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import { useAdminTranslations } from "@/lib/admin-translations";

interface UmamiStatus {
  configured: boolean;
  umamiUrl: string;
  websiteId: string | null;
  umamiStatus: "running" | "unreachable" | "unknown";
  umamiAccessible: boolean;
  setupSteps: string[];
}

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounceRate: number;
  avgVisitTime: number;
}

export default function AdminAnalyticsPage() {
  const [umamiStatus, setUmamiStatus] = useState<UmamiStatus | null>(null);
  const [stats, setStats] = useState<UmamiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useAdminTranslations("analytics");

  useEffect(() => {
    async function checkUmamiStatus() {
      try {
        const response = await fetch("/api/admin/umami/setup");
        const data: ApiResponse<UmamiStatus> = await response.json();
        if (data.success && data.data) {
          setUmamiStatus(data.data);
        }
      } catch (err) {
        console.error("Error checking Umami status:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUmamiStatus();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!umamiStatus?.configured) return;
      
      setStatsLoading(true);
      try {
        const response = await fetch("/api/admin/umami/stats");
        const data: ApiResponse<UmamiStats> = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
          setError(null);
        } else {
          setError(data.error || "Failed to load stats");
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setStatsLoading(false);
      }
    }

    if (umamiStatus?.configured) {
      fetchStats();
    }
  }, [umamiStatus?.configured]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  // Dashboard URL - use LAN IP and point to specific website page
  const baseUrl = umamiStatus?.umamiUrl 
    ? umamiStatus.umamiUrl.replace('localhost', '192.168.1.219').replace('127.0.0.1', '192.168.1.219')
    : "http://192.168.1.219:3010";
  const websiteId = umamiStatus?.websiteId || "851b40c0-6a04-4059-af54-6ba6029cee9a";
  const dashboardUrl = `${baseUrl}/websites/${websiteId}`;

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("checkingStatus")}</p>
        </div>
      </Card>
    );
  }

  if (!umamiStatus?.configured) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">
            {t("description")}
          </p>
        </div>

        <Card className="p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t("notConfigured")}
            </h2>
            
            {umamiStatus && (
              <div className="mb-6">
                {umamiStatus.umamiStatus === "running" ? (
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4">
                    <span className="mr-2">✅</span>
                    {t("serviceRunning")}
                  </div>
                ) : umamiStatus.umamiStatus === "unreachable" ? (
                  <div className="inline-flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg mb-4">
                    <span className="mr-2">⚠️</span>
                    {t("serviceUnreachable")}
                  </div>
                ) : null}
              </div>
            )}

            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {t("configuredDescription")}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">
            {t("last30Days")}
          </p>
        </div>
        <Button
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
        >
          {t("openDashboard")}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-700">
            ⚠️ {error}. <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" className="underline">{t("openDashboard")}</a>
          </p>
        </Card>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("stats.pageviews")}</h3>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.pageviews)}</p>
              <p className="text-xs text-gray-500 mt-2">{t("stats.totalPageViews")}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("stats.visitors")}</h3>
              <p className="text-3xl font-bold text-indigo-600">{formatNumber(stats.visitors)}</p>
              <p className="text-xs text-gray-500 mt-2">{t("stats.uniqueVisitors")}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("stats.visits")}</h3>
              <p className="text-3xl font-bold text-purple-600">{formatNumber(stats.visits)}</p>
              <p className="text-xs text-gray-500 mt-2">{t("stats.totalSessions")}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("stats.bounceRate")}</h3>
              <p className="text-3xl font-bold text-orange-600">{formatPercent(stats.bounceRate)}</p>
              <p className="text-xs text-gray-500 mt-2">{t("stats.singlePageVisits")}</p>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("stats.avgVisitTime")}</h3>
              <p className="text-2xl font-bold text-gray-900">{formatTime(stats.avgVisitTime)}</p>
              <p className="text-xs text-gray-500 mt-2">{t("stats.avgSessionDuration")}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t("fullDashboard")}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t("fullDashboardDescription")}
              </p>
              <Button
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                {t("openUmamiDashboard")}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t("directAccess")} <code className="bg-gray-100 px-1 rounded">{dashboardUrl}</code>
              </p>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-gray-600">{t("noData")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
