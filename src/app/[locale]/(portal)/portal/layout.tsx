import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { portalNavItems } from "@/lib/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole(["ENTITY_OWNER" as const, "ADMIN" as const]);
  } catch {
    redirect("/auth/unauthorized");
  }

  return (
    <DashboardShell type="portal" navItems={portalNavItems}>
      {children}
    </DashboardShell>
  );
}





