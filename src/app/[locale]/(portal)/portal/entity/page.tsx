"use client";

import { useRouter } from "@/i18n/routing";
import { ListingEditor } from "@/components/listing/ListingEditor";
import { usePortalTranslations } from "@/lib/admin-translations";

export default function PortalNewEntityPage() {
  const tPortal = usePortalTranslations("dashboard");
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{tPortal("addEntity")}</h1>
      <ListingEditor
        mode="create"
        role="owner"
        onSaved={() => setTimeout(() => router.push("/portal/dashboard"), 3000)}
        onCancel={() => router.push("/portal/dashboard")}
      />
    </div>
  );
}
