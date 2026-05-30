import { redirect } from "@/i18n/routing";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { portalNavItems } from "@/lib/navigation";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  try {
    // Any authenticated user can access the portal to manage their entities
    await requireAuth();
  } catch {
    redirect({ href: "/auth/signin", locale });
  }

  return (
    <DashboardShell type="portal" navItems={portalNavItems}>
      {children}
    </DashboardShell>
  );
}





