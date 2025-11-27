"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";

function ClaimVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const entityId = searchParams.get("entityId");
  const t = useTranslations("claim");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entityName, setEntityName] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !entityId) {
      setError(t("invalidVerificationLink"));
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
          throw new Error(data.error || t("failedToVerify"));
        }

        setEntityName(data.data?.entityName || null);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedToVerify"));
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
        <p className="text-gray-600">{t("verifying")}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("verificationFailed")}
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.push("/")}>{t("backToDirectory")}</Button>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("claimRequestSubmitted")}
        </h1>
        {entityName && (
          <p className="text-lg text-gray-700 mb-2">
            {t("requestSubmitted", { entityName })}
          </p>
        )}
        <p className="text-gray-600 mb-6">
          {t("adminWillReview")}
        </p>
        <Button onClick={() => router.push("/")}>{t("backToDirectory")}</Button>
      </Card>
    );
  }

  return null;
}

export default function ClaimVerifyFallback() {
  const tCommon = useTranslations("common");
  
  return (
    <Card className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{tCommon("loading")}</p>
    </Card>
  );
}

export default function ClaimVerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={<ClaimVerifyFallback />}>
        <ClaimVerifyContent />
      </Suspense>
    </div>
  );
}
