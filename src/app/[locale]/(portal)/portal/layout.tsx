import { redirect } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth";
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
  // Any signed-in user can use the portal (their listings, their account)
  if (!(await getCurrentUser())) {
    redirect({ href: "/auth/signin?callbackUrl=%2Fportal%2Fdashboard", locale });
  }

  return (
    <DashboardShell type="portal" navItems={portalNavItems}>
      {children}
    </DashboardShell>
  );
}
