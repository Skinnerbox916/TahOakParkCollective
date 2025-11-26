"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t("unauthorized")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("unauthorizedMessage")}
        </p>
        <Link href="/">
          <Button variant="outline">{tCommon("back")}</Button>
        </Link>
      </div>
    </div>
  );
}

