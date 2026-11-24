import { redirect } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth";
import { ROLE } from "@/lib/prismaEnums";
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
  const user = await getCurrentUser();

  if (!user) {
    redirect({ href: "/auth/signin?callbackUrl=%2Fadmin%2Fdashboard", locale });
  } else if (user.adminNeedsStepUp) {
    // Admin role, but this session didn't use a passkey or authenticator code
    redirect({ href: "/auth/step-up?callbackUrl=%2Fadmin%2Fdashboard", locale });
  } else if (!user.roles.includes(ROLE.ADMIN)) {
    redirect({ href: "/auth/unauthorized", locale });
  }

  return (
    <DashboardShell type="admin" navItems={adminNavItems}>
      {children}
    </DashboardShell>
  );
}
