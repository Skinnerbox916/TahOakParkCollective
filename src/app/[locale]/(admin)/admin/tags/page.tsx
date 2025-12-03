"use client";

import { TagManager } from "@/components/admin/TagManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { useTranslations } from "next-intl";

export default function AdminTagsPage() {
  const t = useTranslations("tags");
  
  return (
    <div>
      <PageHeader 
        title={t("pageTitle")}
        description={t("pageDescription")}
      />
      <TagManager />
    </div>
  );
}

