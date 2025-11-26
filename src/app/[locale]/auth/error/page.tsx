"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

export default function AuthErrorPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t("error")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("errorMessage")}
        </p>
        <Link href="/auth/signin">
          <Button>{t("signIn")}</Button>
        </Link>
      </div>
    </div>
  );
}

