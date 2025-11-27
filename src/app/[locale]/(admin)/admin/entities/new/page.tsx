"use client";

import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { useRouter } from "next/navigation";

export default function AdminNewEntity() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/entities");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Entity</h1>
      <AdminEntityForm onSuccess={handleSuccess} />
    </div>
  );
}

