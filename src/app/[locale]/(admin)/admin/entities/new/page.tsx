"use client";

import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { useRouter } from "next/navigation";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminNewEntity() {
  const router = useRouter();
  const { t } = useAdminTranslations("entities.newPage");

  // Open the new listing, where a draft can be shared with its owner.
  const handleSuccess = (entityId: string) => {
    router.push(`/admin/entities/${entityId}/edit`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <AdminEntityForm onSuccess={handleSuccess} />
    </div>
  );
}
