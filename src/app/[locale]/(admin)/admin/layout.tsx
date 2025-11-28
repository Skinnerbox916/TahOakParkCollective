import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNavItems } from "@/lib/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole(["ADMIN" as const]);
  } catch {
    redirect("/auth/unauthorized");
  }

  return (
    <DashboardShell type="admin" navItems={adminNavItems}>
      {children}
    </DashboardShell>
  );
}

