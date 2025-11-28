"use client";

import { Link } from "@/i18n/routing";
import { UserMenu } from "./UserMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { DashboardType } from "@/lib/navigation";

interface DashboardHeaderProps {
  type: DashboardType;
  onMenuClick: () => void;
}

export function DashboardHeader({ type, onMenuClick }: DashboardHeaderProps) {

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open navigation menu"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo - links to main site */}
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold text-indigo-600"
            >
              TahOak Park Collective
            </Link>

            {/* Dashboard type badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {type === "admin" ? "Admin" : "Portal"}
            </span>
          </div>

          {/* Right side: Language switcher + User menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

