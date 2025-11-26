import Link from "next/link";
import { BusinessWithRelations } from "@/types";
import { truncate } from "@/lib/utils";

interface BusinessCardProps {
  business: BusinessWithRelations;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 h-full flex flex-col"
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Business Name */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {business.name}
        </h3>

        {/* Category Tag */}
        {business.category && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md whitespace-nowrap">
              {business.category.name}
            </span>
          </div>
        )}

        {/* Description */}
        {business.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
            {truncate(business.description, 150)}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-1.5 text-sm text-gray-500 mb-4">
          {business.address && (
            <p className="flex items-start gap-2">
              <span className="mt-0.5">📍</span>
              <span className="line-clamp-1">{business.address}</span>
            </p>
          )}
          {business.phone && (
            <p className="flex items-center gap-2">
              <span>📞</span>
              <span>{business.phone}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}


