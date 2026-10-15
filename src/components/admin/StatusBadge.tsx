"use client";

import { EntityStatus, ENTITY_STATUS } from "@/lib/prismaEnums";
import { useAdminTranslations } from "@/lib/admin-translations";

interface StatusBadgeProps {
  status: EntityStatus | null | undefined;
}

const statusClasses: Record<EntityStatus, string> = {
  ACTIVE: "bg-success-100 text-success-800 border-success-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  PENDING_REVIEW: "bg-warning-100 text-warning-800 border-warning-200",
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



