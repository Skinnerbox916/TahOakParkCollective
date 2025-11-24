"use client";

import dynamic from "next/dynamic";
import { BusinessWithRelations } from "@/types";
import { formatPhoneNumber } from "@/lib/utils";
import { BusinessHours } from "./BusinessHours";
import { SocialMediaLinks } from "./SocialMediaLinks";

// Dynamically import map component to avoid SSR issues
const BusinessMap = dynamic(
  () => import("@/components/search/BusinessMap").then((mod) => mod.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

interface BusinessDetailProps {
  business: BusinessWithRelations;
}

export function BusinessDetail({ business }: BusinessDetailProps) {
  const hasLocation = business.latitude && business.longitude;
  const mapCenter = hasLocation
    ? ([business.latitude!, business.longitude!] as [number, number])
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {business.name}
            </h1>
            {business.category && (
              <span className="inline-block px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded mb-3">
                {business.category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {business.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {business.description}
              </p>
            </div>
          )}

          {/* Map */}
          {hasLocation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Location
              </h2>
              <BusinessMap
                businesses={[business]}
                center={mapCenter}
                zoom={15}
              />
            </div>
          )}

          {/* Images (if available) */}
          {business.images && Array.isArray(business.images) && business.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(business.images as string[]).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${business.name} - Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Contact
            </h2>
            <div className="space-y-3">
              {business.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Address
                  </p>
                  <p className="text-gray-900">{business.address}</p>
                </div>
              )}
              {business.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Phone
                  </p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {formatPhoneNumber(business.phone)}
                  </a>
                </div>
              )}
              {business.website && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Website
                  </p>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 break-all"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Business Hours */}
          {business.hours && (
            <BusinessHours hours={business.hours as Record<string, any>} />
          )}

          {/* Social Media */}
          {business.socialMedia && (
            <SocialMediaLinks
              socialMedia={business.socialMedia as Record<string, string>}
            />
          )}
        </div>
      </div>
    </div>
  );
}



