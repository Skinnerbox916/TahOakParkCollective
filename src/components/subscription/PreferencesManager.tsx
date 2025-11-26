"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse } from "@/types";

interface SubscriberPreferences {
  email: string;
  preferences: {
    newsletter?: boolean;
    newBusinesses?: boolean;
    events?: boolean;
    updates?: boolean;
  };
  verified: boolean;
  unsubscribed: boolean;
}

interface PreferencesManagerProps {
  token: string;
}

export function PreferencesManager({ token }: PreferencesManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<SubscriberPreferences | null>(null);
  const [preferences, setPreferences] = useState({
    newsletter: true,
    newBusinesses: true,
    events: true,
    updates: true,
  });

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(
          `/api/public/subscribe/preferences?token=${token}`
        );
        const result: ApiResponse<SubscriberPreferences> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load preferences");
        }

        if (result.data) {
          setData(result.data);
          setPreferences(result.data.preferences || {
            newsletter: true,
            newBusinesses: true,
            events: true,
            updates: true,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/public/subscribe/preferences?token=${token}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences }),
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update preferences");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm("Are you sure you want to unsubscribe? You can resubscribe at any time.")) {
      return;
    }

    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      const response = await fetch(
        `/api/public/subscribe/unsubscribe?token=${token}`,
        {
          method: "POST",
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to unsubscribe");
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              unsubscribed: true,
            }
          : {
              email: "",
              preferences: {},
              verified: true,
              unsubscribed: true,
            }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your preferences...</p>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Manage Your Preferences
        </h2>
        {data && (
          <p className="text-gray-600">
            Subscribed as: <strong>{data.email}</strong>
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-6">
          Preferences updated successfully!
        </div>
      )}

      {data?.unsubscribed ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            You're Unsubscribed
          </h3>
          <p className="text-gray-600 mb-6">
            You're no longer receiving emails from TahOak Park Collective.
          </p>
          <p className="text-sm text-gray-500">
            To resubscribe, please visit the{" "}
            <a href="/subscribe" className="text-indigo-600 hover:underline">
              subscription page
            </a>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Email Preferences
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.newsletter || false}
                  onChange={(e) =>
                    setPreferences({ ...preferences, newsletter: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">
                  Newsletter (general updates and community news)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.newBusinesses || false}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      newBusinesses: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">
                  New Businesses (notifications when new businesses join)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.events || false}
                  onChange={(e) =>
                    setPreferences({ ...preferences, events: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">
                  Events (upcoming events and activities)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.updates || false}
                  onChange={(e) =>
                    setPreferences({ ...preferences, updates: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">
                  Community Updates (important announcements)
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Unsubscribe
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              You can unsubscribe from all emails at any time. You'll still be
              able to manage your preferences if you decide to resubscribe.
            </p>
            <Button
              type="button"
              variant="danger"
              onClick={handleUnsubscribe}
              disabled={saving}
            >
              Unsubscribe from All Emails
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

