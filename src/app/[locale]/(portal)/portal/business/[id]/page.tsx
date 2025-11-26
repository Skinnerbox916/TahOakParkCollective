"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BusinessForm } from "@/components/business/BusinessForm";
import { EntityWithRelations, ApiResponse } from "@/types";
import { Card } from "@/components/ui/Card";

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<EntityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      if (!params.id || typeof params.id !== "string") {
        setError("Invalid business ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/businesses/${params.id}`);
        const data: ApiResponse<EntityWithRelations> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch business");
        }

        setBusiness(data.data!);
      } catch (err) {
        console.error("Error fetching business:", err);
        setError(err instanceof Error ? err.message : "Failed to load business");
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Business</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading business...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Business</h1>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || "Business not found"}</p>
          <button
            onClick={() => router.push("/portal/dashboard")}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Business</h1>
      <BusinessForm
        business={business}
        onSuccess={() => router.push("/portal/dashboard")}
      />
    </div>
  );
}



