"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PreferencesManager } from "@/components/subscription/PreferencesManager";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";

function ManagePreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("subscribe");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!token) {
      setError(t("invalidLink"));
    }
  }, [token, t]);

  return (
    <>
      {error ? (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("invalidLinkTitle")}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            {t("ifYouNeed")}{" "}
            <Link href="/subscribe" className="text-indigo-600 hover:underline">
              {t("subscribeAgain")}
            </Link>
            {" "}{t("orContactUs")}
          </p>
        </Card>
      ) : token ? (
        <PreferencesManager token={token} />
      ) : (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </Card>
      )}
    </>
  );
}

function ManagePreferencesFallback() {
  const t = useTranslations("subscribe");
  
  return (
    <Card className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{t("loading")}</p>
    </Card>
  );
}

export default function ManagePreferencesPage() {
  const t = useTranslations("subscribe");
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("manageTitle")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("manageSubtitle")}
          </p>
        </div>

        <Suspense fallback={<ManagePreferencesFallback />}>
          <ManagePreferencesContent />
        </Suspense>
      </main>
    </div>
  );
}


