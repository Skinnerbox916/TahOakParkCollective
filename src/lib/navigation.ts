/**
 * Centralized navigation configuration
 * Single source of truth for all navigation items across the application
 */

export type NavItem = {
  href: string;
  labelKey: string;
};

/**
 * Public site navigation items
 * Used in PublicNavbar and MobileMenu for unauthenticated/public pages
 */
export const publicNavItems: NavItem[] = [
  { href: "/", labelKey: "directory" },
  { href: "/suggest", labelKey: "suggest" },
  { href: "/report", labelKey: "report" },
  { href: "/claim", labelKey: "claim" },
  { href: "/subscribe", labelKey: "subscribe" },
];

/**
 * Admin dashboard navigation items
 * Used in DashboardSidebar for admin routes
 */
export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "dashboard" },
  { href: "/admin/entities", labelKey: "entities" },
  { href: "/admin/quick-add", labelKey: "quickAdd" },
  { href: "/admin/pending-changes", labelKey: "pendingChanges" },
  { href: "/admin/spot-checks", labelKey: "spotChecks" },
  { href: "/admin/suggestions", labelKey: "suggestions" },
  { href: "/admin/issue-reports", labelKey: "issueReports" },
  { href: "/admin/subscribers", labelKey: "subscribers" },
  { href: "/admin/analytics", labelKey: "analytics" },
  { href: "/admin/tags", labelKey: "tags" },
  { href: "/admin/users", labelKey: "users" },
];

/**
 * Portal (business owner) dashboard navigation items
 * Used in DashboardSidebar for portal routes
 */
export const portalNavItems: NavItem[] = [
  { href: "/portal/dashboard", labelKey: "dashboard" },
  { href: "/portal/business", labelKey: "myBusiness" },
];

/**
 * Dashboard types for the shared dashboard shell
 */
export type DashboardType = "admin" | "portal";

/**
 * Get navigation items for a specific dashboard type
 */
export function getNavItemsForDashboard(type: DashboardType): NavItem[] {
  return type === "admin" ? adminNavItems : portalNavItems;
}

/**
 * Get the home route for a specific dashboard type
 */
export function getDashboardHomeRoute(type: DashboardType): string {
  return type === "admin" ? "/admin/dashboard" : "/portal/dashboard";
}

