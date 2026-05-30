import { redirect } from "@/i18n/routing";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNavItems } from "@/lib/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  try {
    await requireRole(["ADMIN" as const]);
  } catch {
    redirect({ href: "/auth/unauthorized", locale });
  }

  return (
    <DashboardShell type="admin" navItems={adminNavItems}>
      {children}
    </DashboardShell>
  );
}

