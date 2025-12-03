"use client";

import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { useRouter } from "next/navigation";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminNewEntity() {
  const router = useRouter();
  const { t } = useAdminTranslations("entities.newPage");

  const handleSuccess = () => {
    router.push("/admin/entities");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <AdminEntityForm onSuccess={handleSuccess} />
    </div>
  );
}
