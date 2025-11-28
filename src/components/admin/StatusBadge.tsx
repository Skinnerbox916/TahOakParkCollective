"use client";

import { EntityStatus } from "@/lib/prismaEnums";
import { useAdminTranslations } from "@/lib/admin-translations";

interface StatusBadgeProps {
  status: EntityStatus;
}

const statusClasses: Record<EntityStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { tStatus } = useAdminTranslations();
  const className = statusClasses[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {tStatus(status)}
    </span>
  );
}



