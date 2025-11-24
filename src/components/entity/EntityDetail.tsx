"use client";

import dynamic from "next/dynamic";
import { EntityWithRelations } from "@/types";
import { formatPhoneNumber } from "@/lib/utils";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import type { EntityType } from "@/lib/prismaEnums";
import { BusinessHours } from "../business/BusinessHours";
import { SocialMediaLinks } from "../business/SocialMediaLinks";

// Dynamically import map component to avoid SSR issues
const EntityMap = dynamic(
  () => import("@/components/search/EntityMap").then((mod) => mod.EntityMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

interface EntityDetailProps {
  entity: EntityWithRelations;
}

export function EntityDetail({ entity }: EntityDetailProps) {
  const hasLocation = entity.latitude && entity.longitude;
  const mapCenter = hasLocation
    ? ([entity.latitude!, entity.longitude!] as [number, number])
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {entity.name}
            </h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded">
                {ENTITY_TYPE_LABELS[entity.entityType as EntityType]}
              </span>
              {entity.category && (
                <span className="inline-block px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded">
                  {entity.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {entity.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {entity.description}
              </p>
            </div>
          )}

          {/* Map */}
          {hasLocation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Location
              </h2>
              <EntityMap
                entities={[entity]}
                center={mapCenter}
                zoom={15}
              />
            </div>
          )}

          {/* Images (if available) */}
          {entity.images && Array.isArray(entity.images) && entity.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(entity.images as string[]).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${entity.name} - Photo ${index + 1}`}
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
              {entity.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Address
                  </p>
                  <p className="text-gray-900">{entity.address}</p>
                </div>
              )}
              {entity.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Phone
                  </p>
                  <a
                    href={`tel:${entity.phone}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {formatPhoneNumber(entity.phone)}
                  </a>
                </div>
              )}
              {entity.website && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Website
                  </p>
                  <a
                    href={entity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 break-all"
                  >
                    {entity.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Business Hours */}
          {entity.hours && (
            <BusinessHours hours={entity.hours as Record<string, any>} />
          )}

          {/* Social Media */}
          {entity.socialMedia && (
            <SocialMediaLinks
              socialMedia={entity.socialMedia as Record<string, string>}
            />
          )}
        </div>
      </div>
    </div>
  );
}

