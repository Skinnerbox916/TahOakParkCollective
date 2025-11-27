"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ROLE } from "@/lib/prismaEnums";
import { RoleBadges } from "@/components/admin/RoleBadge";

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  const isAdmin = session?.user?.roles?.includes(ROLE.ADMIN) ?? false;
  const isBusinessOwner = (session?.user?.roles?.includes(ROLE.BUSINESS_OWNER) ?? false) || isAdmin;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Close menu on ESC key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!session?.user) {
    return null;
  }

  const userDisplayName = session.user.name || session.user.email || t("user");

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={t("userMenu") || "User menu"}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 hidden sm:inline max-w-[120px] truncate">
            {userDisplayName}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session.user.name || t("user")}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session.user.email}
            </p>
            {session.user.roles && session.user.roles.length > 0 && (
              <div className="mt-2">
                <RoleBadges roles={session.user.roles} />
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="mr-3">⚙️</span>
                {tNav("admin")} {tNav("dashboard")}
              </Link>
            )}
            {isBusinessOwner && (
              <Link
                href="/portal/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="mr-3">🏢</span>
                {t("businessPortal")}
              </Link>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="mr-3">🚪</span>
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

