"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";
import { Link } from "@/i18n/routing";

function VerifySubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("subscribe");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t("invalidVerificationLink"));
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
          throw new Error(data.error || t("failedToVerify"));
        }

        setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToVerify"));
      } finally {
        setLoading(false);
      }
    }

    verifySubscription();
  }, [token]);

  if (loading) {
    return (
      <Card className="p-8 text-center max-w-md w-full mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t("verifying")}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center max-w-md w-full mx-4">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("verificationFailed")}
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <Button href="/subscribe" className="w-full">
            {t("trySubscribingAgain")}
          </Button>
          <Button href="/" variant="outline" className="w-full">
            {t("goToHome")}
          </Button>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8 text-center max-w-md w-full mx-4">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("subscriptionVerified")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t("emailVerified")}
        </p>
        <div className="space-y-3">
          <Button href="/" className="w-full">
            {t("goToHome")}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}

export default function VerifySubscriptionFallback() {
  const t = useTranslations("subscribe");
  
  return (
    <Card className="p-8 text-center max-w-md w-full mx-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{t("loading")}</p>
    </Card>
  );
}

export default function VerifySubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={<VerifySubscriptionFallback />}>
        <VerifySubscriptionContent />
      </Suspense>
    </div>
  );
}
