"use client";

import { TagManager } from "@/components/admin/TagManager";
import { useTranslations } from "next-intl";

export default function AdminTagsPage() {
  const t = useTranslations("tags");
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t("pageDescription")}
        </p>
      </div>
      <TagManager />
    </div>
  );
}

