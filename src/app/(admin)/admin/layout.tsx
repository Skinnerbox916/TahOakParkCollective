import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar type="admin" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

