"use client";

import { EntityStatus, ENTITY_STATUS } from "@/lib/prismaEnums";
import { useAdminTranslations } from "@/lib/admin-translations";

interface StatusBadgeProps {
  status: EntityStatus | null | undefined;
}

const statusClasses: Record<EntityStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { tStatus } = useAdminTranslations();
  
  // Default to ACTIVE if status is undefined/null
  const safeStatus = status || ENTITY_STATUS.ACTIVE;
  const className = statusClasses[safeStatus] || statusClasses[ENTITY_STATUS.ACTIVE];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {tStatus(safeStatus)}
    </span>
  );
}



