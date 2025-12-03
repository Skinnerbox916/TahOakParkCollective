"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function AdminFeaturedPage() {
  const { t } = useAdminTranslations("featured");

  return (
    <div>
      <PageHeader title="Featured Entities" />
      
      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Featured Entity Management
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Featured entity management coming soon. This will allow you to manage which entities appear in the featured section on the homepage.
          </p>
        </div>
      </Card>
    </div>
  );
}

