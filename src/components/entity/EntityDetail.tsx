"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { formatPhoneNumber } from "@/lib/utils";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import type { EntityType, TagCategory } from "@/lib/prismaEnums";
import { BusinessHours } from "../business/BusinessHours";
import { SocialMediaLinks } from "../business/SocialMediaLinks";
import { TagBadge } from "@/components/tags/TagBadge";

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

  // Group tags by category
  const groupedTags = (entity.tags as EntityTagWithTag[] || []).reduce((acc, entityTag) => {
    const category = entityTag.tag.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(entityTag);
    return acc;
  }, {} as Record<TagCategory, EntityTagWithTag[]>);

  const tagOrder: TagCategory[] = ["IDENTITY", "FRIENDLINESS", "AMENITY"];

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
            
            {/* Tags */}
            {entity.tags && entity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tagOrder.map(category => {
                  if (!groupedTags[category]) return null;
                  return groupedTags[category].map(et => (
                    <TagBadge 
                      key={et.id} 
                      name={et.tag.name} 
                      category={et.tag.category}
                      verified={et.verified}
                    />
                  ));
                })}
              </div>
            )}
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
          {entity.images && typeof entity.images === 'object' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Photos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(entity.images as any).hero && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Cover Image</p>
                    <img
                      src={(entity.images as any).hero}
                      alt={`${entity.name} - Cover`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {(entity.images as any).logo && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Logo</p>
                    <img
                      src={(entity.images as any).logo}
                      alt={`${entity.name} - Logo`}
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg p-4"
                    />
                  </div>
                )}
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

          {/* Claim Entity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Own This Business?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Claim this listing to manage your business information.
            </p>
            <Link
              href={`/claim?entityId=${entity.id}`}
              className="inline-block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium mb-3"
            >
              Claim This Entity
            </Link>
          </div>

          {/* Report Issue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Found an Issue?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              See incorrect information? Let us know.
            </p>
            <Link
              href={`/report?entityId=${entity.id}`}
              className="inline-block w-full text-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
