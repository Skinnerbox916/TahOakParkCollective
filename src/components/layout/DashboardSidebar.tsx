"use client";

import { useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useAdminTranslations, usePortalTranslations } from "@/lib/admin-translations";
import type { NavItem, DashboardType } from "@/lib/navigation";

interface DashboardSidebarProps {
  type: DashboardType;
  navItems: NavItem[];
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
}

export function DashboardSidebar({
  type,
  navItems,
  isDrawerOpen,
  onDrawerClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const adminSidebar = useAdminTranslations("sidebar");
  const portalSidebar = usePortalTranslations("sidebar");
  
  const translateLabel = type === "admin" ? adminSidebar.t : portalSidebar;
  const sectionTitle =
    type === "admin"
      ? adminSidebar.t("sectionTitle")
      : portalSidebar("sectionTitle");

  // Close drawer on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDrawerClose();
      }
    }

    if (isDrawerOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen, onDrawerClose]);

  // Close drawer on route change
  useEffect(() => {
    onDrawerClose();
  }, [pathname, onDrawerClose]);

  const NavContent = () => (
    <nav className="p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {sectionTitle}
      </h2>
      <ul className="space-y-1">
        {navItems.map((item) => {
          // Remove locale prefix for comparison
          const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";
          const isActive =
            pathWithoutLocale === item.href ||
            pathWithoutLocale.startsWith(item.href + "/");

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
                {translateLabel(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible on md+ screens */}
      <aside className="hidden md:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-4rem)] flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onDrawerClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation drawer"
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-indigo-600">
              TahOak
            </span>
            <button
              onClick={onDrawerClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close navigation"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Drawer Navigation */}
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      </aside>
    </>
  );
}

