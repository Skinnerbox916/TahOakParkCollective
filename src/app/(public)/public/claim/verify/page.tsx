"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";

function ClaimVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const entityId = searchParams.get("entityId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entityName, setEntityName] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !entityId) {
      setError("Invalid verification link");
      setLoading(false);
      return;
    }

    async function verifyClaim() {
      try {
        const response = await fetch(
          `/api/public/claim/verify?token=${token}&entityId=${entityId}`
        );
        const data: ApiResponse<{
          email: string;
          entityId: string;
          entityName: string;
          pendingChangeId: string;
        }> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to verify claim");
        }

        setEntityName(data.data?.entityName || null);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify claim");
      } finally {
        setLoading(false);
      }
    }

    verifyClaim();
  }, [token, entityId]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your claim request...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verification Failed
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/")}>Back to Directory</Button>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Claim Request Submitted!
        </h1>
        {entityName && (
          <p className="text-lg text-gray-700 mb-2">
            Your request to claim <strong>{entityName}</strong> has been submitted.
          </p>
        )}
        <p className="text-gray-600 mb-6">
          An administrator will review your claim and get back to you soon.
        </p>
        <Button onClick={() => router.push("/")}>Back to Directory</Button>
      </Card>
    );
  }

  return null;
}

export default function ClaimVerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </Card>
      }>
        <ClaimVerifyContent />
      </Suspense>
    </div>
  );
}
