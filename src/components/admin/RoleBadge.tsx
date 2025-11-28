"use client";

import { Role } from "@/lib/prismaEnums";
import { useAdminTranslations } from "@/lib/admin-translations";

interface RoleBadgeProps {
  role: Role;
  roles?: Role[]; // For backward compatibility, can accept single role or roles array
}

const roleClasses: Record<Role, string> = {
  USER: "bg-gray-100 text-gray-800 border-gray-200",
  ENTITY_OWNER: "bg-blue-100 text-blue-800 border-blue-200",
  ADMIN: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function RoleBadge({ role, roles }: RoleBadgeProps) {
  const { tRole } = useAdminTranslations();
  const className = roleClasses[role];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {tRole(role)}
    </span>
  );
}

// Component to display multiple role badges
interface RoleBadgesProps {
  roles: Role[];
}

export function RoleBadges({ roles }: RoleBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <RoleBadge key={role} role={role} />
      ))}
    </div>
  );
}

