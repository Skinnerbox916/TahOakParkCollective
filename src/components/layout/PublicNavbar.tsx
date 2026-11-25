"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { publicNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { usePublicNavLabel } from "./usePublicNavLabel";
import { useAuth } from "@/lib/use-auth";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Public-facing navigation bar.
 * Used on public pages (home, directory, suggest, report, etc.) and auth pages.
 * Dashboard pages (admin/portal) use DashboardHeader instead.
 */
export function PublicNavbar() {
  const { session, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("common");
  const navLabel = usePublicNavLabel();
  const pathname = usePathname();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            <div className="flex items-center min-w-0 flex-shrink">
              <Link href="/" className="text-lg sm:text-xl font-bold text-primary-600 truncate">
                TahOak Park Collective
              </Link>
            </div>

            {/* Desktop links (the logo already goes home) */}
            <div className="hidden lg:flex items-center gap-1 min-w-0">
              {publicNavItems
                .filter((item) => item.href !== "/")
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-ring",
                      pathname === item.href ? "text-primary-700 bg-primary-50" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {navLabel(item.labelKey)}
                  </Link>
                ))}
            </div>

            {/* Desktop account controls */}
            <div className="hidden lg:flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <LanguageSwitcher />
              {loading ? (
                <span className="text-gray-500 text-sm">{t("loading")}</span>
              ) : session ? (
                <UserMenu />
              ) : (
                <>
                  <Button href="/auth/signup" variant="outline" size="sm">
                    {t("signUp")}
                  </Button>
                  <Button href="/auth/signin" size="sm">
                    {t("signIn")}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile and tablet: the links live in the menu */}
            <div className="flex lg:hidden items-center space-x-2">
              <LanguageSwitcher />
              {loading ? (
                <span className="text-gray-500 text-sm">{t("loading")}</span>
              ) : session ? (
                <UserMenu />
              ) : (
                <>
                  <Button href="/auth/signin" size="sm">
                    {t("signIn")}
                  </Button>
                </>
              )}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={t("openMenu")}
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
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

// Backward compatibility alias
export { PublicNavbar as Navbar };

