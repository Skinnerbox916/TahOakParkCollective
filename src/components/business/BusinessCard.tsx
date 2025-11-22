import Link from "next/link";
import { BusinessWithRelations } from "@/types";
import { NEIGHBORHOOD_LABELS } from "@/lib/constants";
import { truncate } from "@/lib/utils";
import type { Neighborhood } from "@/lib/prismaEnums";

interface BusinessCardProps {
  business: BusinessWithRelations;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {business.name}
          </h3>
          {business.category && (
            <span className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded">
              {business.category.name}
            </span>
          )}
        </div>

        {business.neighborhoods && business.neighborhoods.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {business.neighborhoods.map((neighborhood: Neighborhood) => (
              <span
                key={neighborhood}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded"
              >
                {NEIGHBORHOOD_LABELS[neighborhood]}
              </span>
            ))}
          </div>
        )}

        {business.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncate(business.description, 120)}
          </p>
        )}

        <div className="space-y-1 text-sm text-gray-500">
          {business.address && (
            <p className="flex items-center gap-1">
              <span>📍</span>
              <span>{business.address}</span>
            </p>
          )}
          {business.phone && (
            <p className="flex items-center gap-1">
              <span>📞</span>
              <span>{business.phone}</span>
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}


