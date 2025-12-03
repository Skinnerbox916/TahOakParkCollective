"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ROLE } from "@/lib/prismaEnums";
import { publicNavItems } from "@/lib/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile menu for public pages.
 * Dashboard pages (admin/portal) use DashboardSidebar instead.
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const tSuggest = useTranslations("suggest");
  const tReport = useTranslations("report");
  const tClaim = useTranslations("claim");
  const tSubscribe = useTranslations("subscribe");

  const isAdmin = session?.user?.roles?.includes(ROLE.ADMIN) ?? false;

  // Translation lookup for public nav items
  const getNavLabel = (labelKey: string) => {
    switch (labelKey) {
      case "directory": return t("directory");
      case "suggest": return tSuggest("title");
      case "report": return tReport("title");
      case "claim": return tClaim("title");
      case "subscribe": return tSubscribe("title");
      default: return labelKey;
    }
  };

  // Close menu on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t("menu")}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={t("closeMenu")}
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

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1">
              {/* Public navigation items from shared config */}
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {getNavLabel(item.labelKey)}
                </Link>
              ))}

              {/* Dashboard links for authenticated users */}
              {session && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={onClose}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {tNav("admin")} {tNav("dashboard")}
                    </Link>
                  )}
                  <Link
                    href="/portal/dashboard"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {t("businessPortal")}
                  </Link>
                </div>
              )}

              {/* Auth links for unauthenticated users */}
              {!session && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <Link
                    href="/auth/signin"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {t("signIn")}
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {t("signUp")}
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* User Info / Sign Out */}
          {session && (
            <div className="border-t border-gray-200 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900">
                  {session.user?.name || t("user")}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t("signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

