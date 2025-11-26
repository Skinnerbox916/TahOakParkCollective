"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiResponse } from "@/types";

interface SubscribeFormProps {
  onSuccess?: () => void;
}

export function SubscribeForm({ onSuccess }: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h2>
        <p className="text-gray-600 mb-4">
          We've sent a verification link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Click the link in the email to confirm your subscription. The link will expire in 7 days.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Subscribe to Updates
      </h2>
      <p className="text-gray-600 mb-6">
        Get notified about new businesses, events, and community updates in TahOak Park.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="your@email.com"
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By subscribing, you agree to receive email updates from TahOak Park Collective.
          You can unsubscribe at any time.
        </p>
      </form>
    </Card>
  );
}

