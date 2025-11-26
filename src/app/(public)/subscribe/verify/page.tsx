"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import Link from "next/link";

export default function VerifySubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid verification link");
      setLoading(false);
      return;
    }

    async function verifySubscription() {
      try {
        const response = await fetch(
          `/api/public/subscribe/verify?token=${token}`
        );
        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to verify subscription");
        }

        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify subscription");
      } finally {
        setLoading(false);
      }
    }

    verifySubscription();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your subscription...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button href="/subscribe" className="w-full">
              Try Subscribing Again
            </Button>
            <Button href="/" variant="outline" className="w-full">
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Subscription Verified!
          </h2>
          <p className="text-gray-600 mb-6">
            Your email has been verified and you're now subscribed to updates from TahOak Park Collective.
          </p>
          <div className="space-y-3">
            <Button href="/" className="w-full">
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

