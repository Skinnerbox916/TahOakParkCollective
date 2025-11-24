import { Role } from "@/lib/prismaEnums";

interface RoleBadgeProps {
  role: Role;
  roles?: Role[]; // For backward compatibility, can accept single role or roles array
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  USER: {
    label: "User",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  BUSINESS_OWNER: {
    label: "Business Owner",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
};

export function RoleBadge({ role, roles }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
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

