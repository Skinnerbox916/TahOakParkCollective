"use client";

import { BusinessForm } from "@/components/business/BusinessForm";

export default function PortalBusiness() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Business</h1>
      <BusinessForm />
    </div>
  );
}
