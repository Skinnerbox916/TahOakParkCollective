import { BusinessStatus } from "@/lib/prismaEnums";

interface StatusBadgeProps {
  status: BusinessStatus;
}

const statusConfig: Record<BusinessStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}



