"use client";

import { EntityForm } from "@/components/entity/EntityForm";

export default function PortalNewEntityPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Entity</h1>
      <EntityForm />
    </div>
  );
}

