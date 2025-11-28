"use client";

import { EntityForm } from "@/components/entity/EntityForm";
import { usePortalTranslations } from "@/lib/admin-translations";

export default function PortalNewEntityPage() {
  const tPortal = usePortalTranslations("dashboard");
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {tPortal("addEntity")}
      </h1>
      <EntityForm />
    </div>
  );
}

