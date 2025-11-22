import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole(["BUSINESS_OWNER" as const, "ADMIN" as const]);
  } catch {
    redirect("/auth/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar type="portal" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

