"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse } from "@/types";
import { useAdminTranslations } from "@/lib/admin-translations";

interface Subscriber {
  id: string;
  email: string;
  verified: boolean;
  verifiedAt: Date | null;
  preferences: {
    newsletter?: boolean;
    newBusinesses?: boolean;
    events?: boolean;
    updates?: boolean;
  } | null;
  unsubscribed: boolean;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type FilterType = "all" | "verified" | "unverified" | "unsubscribed";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useAdminTranslations("subscribers");
  const { t: tCommon } = useAdminTranslations("common");

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("filter", filter);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/admin/subscribers?${params.toString()}`);
      const data: ApiResponse<Subscriber[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch subscribers");
      }

      setSubscribers(data.data || []);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError(err instanceof Error ? err.message : "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filter === "all" || searchQuery.trim()) {
        fetchSubscribers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatDate = (date: Date | string | null): string => {
    if (!date) return t("never");
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (subscriber: Subscriber) => {
    if (subscriber.unsubscribed) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          {t("stats.unsubscribed")}
        </span>
      );
    }
    if (subscriber.verified) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {t("stats.verified")}
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        {t("stats.unverified")}
      </span>
    );
  };

  const getPreferenceCount = (preferences: Subscriber["preferences"]): number => {
    if (!preferences) return 0;
    return Object.values(preferences).filter(Boolean).length;
  };

  const totalCount = subscribers.length;
  const verifiedCount = subscribers.filter(s => s.verified && !s.unsubscribed).length;
  const unverifiedCount = subscribers.filter(s => !s.verified).length;
  const unsubscribedCount = subscribers.filter(s => s.unsubscribed).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t("description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t("stats.total")}</div>
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t("stats.verified")}</div>
          <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t("stats.unverified")}</div>
          <div className="text-2xl font-bold text-yellow-600">{unverifiedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">{t("stats.unsubscribed")}</div>
          <div className="text-2xl font-bold text-red-600">{unsubscribedCount}</div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              label={t("searchLabel")}
            />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("filterLabel")}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{t("filters.all")}</option>
                <option value="verified">{t("filters.verified")}</option>
                <option value="unverified">{t("filters.unverified")}</option>
                <option value="unsubscribed">{t("filters.unsubscribed")}</option>
              </select>
            </div>
            <Button variant="outline" onClick={fetchSubscribers} disabled={loading}>
              {tCommon("refresh")}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        </Card>
      ) : subscribers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("noSubscribers")}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? t("tryAdjusting")
                : t("noMatch")}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.preferences")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.verified")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.subscribed")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("columns.lastUpdated")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscriber.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscriber)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {subscriber.preferences ? (
                          <div className="flex flex-wrap gap-2">
                            {subscriber.preferences.newsletter && (
                              <span className="inline-flex px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                                {t("preferences.newsletter")}
                              </span>
                            )}
                            {subscriber.preferences.newBusinesses && (
                              <span className="inline-flex px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                                {t("preferences.newBusinesses")}
                              </span>
                            )}
                            {subscriber.preferences.events && (
                              <span className="inline-flex px-2 py-0.5 text-xs rounded bg-pink-100 text-pink-800">
                                {t("preferences.events")}
                              </span>
                            )}
                            {subscriber.preferences.updates && (
                              <span className="inline-flex px-2 py-0.5 text-xs rounded bg-indigo-100 text-indigo-800">
                                {t("preferences.updates")}
                              </span>
                            )}
                            {getPreferenceCount(subscriber.preferences) === 0 && (
                              <span className="text-gray-400 text-xs">{t("preferences.none")}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">{t("preferences.none")}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subscriber.verified ? (
                        <span className="text-green-600">
                          {formatDate(subscriber.verifiedAt)}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t("notVerified")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subscriber.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subscriber.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
