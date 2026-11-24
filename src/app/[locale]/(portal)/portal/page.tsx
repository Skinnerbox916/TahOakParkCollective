import { redirect } from "@/i18n/routing";

export default async function PortalIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/portal/dashboard", locale });
}
