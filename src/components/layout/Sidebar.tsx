"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface SidebarProps {
  type: "admin" | "portal";
}

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/users", label: "Users" },
];

const portalNavItems = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/business", label: "My Business" },
];

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = type === "admin" ? adminNavItems : portalNavItems;

  // Don't show sidebar on mobile for now
  return (
    <aside className="hidden md:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          {type === "admin" ? "Admin" : "Business Portal"}
        </h2>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}


