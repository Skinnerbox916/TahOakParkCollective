"use client";

import { useRouter } from "@/i18n/routing";
import { ListingEditor } from "@/components/listing/ListingEditor";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminNewEntity() {
  const router = useRouter();
  const { t } = useAdminTranslations("entities.newPage");

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <ListingEditor
        mode="create"
        role="admin"
        // Open the new listing, where a draft can be shared with its owner.
        onSaved={(result) => {
          if (result.kind === "created") router.push(`/admin/entities/${result.entityId}/edit`);
        }}
        onCancel={() => router.push("/admin/entities")}
      />
    </div>
  );
}
