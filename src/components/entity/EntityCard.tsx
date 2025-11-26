import Link from "next/link";
import { EntityWithRelations, EntityTagWithTag } from "@/types";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";
import { truncate } from "@/lib/utils";
import type { EntityType } from "@/lib/prismaEnums";
import { TagBadge } from "@/components/tags/TagBadge";

interface EntityCardProps {
  entity: EntityWithRelations;
}

export function EntityCard({ entity }: EntityCardProps) {
  // Get first 3 tags
  const tags = (entity.tags as EntityTagWithTag[] || []).slice(0, 3);
  const images = entity.images as Record<string, string> | null;

  return (
    <Link
      href={`/entities/${entity.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 h-full flex flex-col overflow-hidden"
    >
      {/* Hero Image */}
      {images?.hero ? (
        <div className="h-48 w-full relative bg-gray-100">
          <img
            src={images.hero}
            alt={`${entity.name} cover`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-3">
          {/* Logo */}
          {images?.logo && (
            <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              <img 
                src={images.logo} 
                alt={`${entity.name} logo`}
                className="w-full h-full object-contain p-1"
              />
            </div>
          )}
          
          {/* Entity Name */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
            {entity.name}
          </h3>
        </div>

        {/* Category & Type Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md whitespace-nowrap">
            {ENTITY_TYPE_LABELS[entity.entityType as EntityType]}
          </span>
          {entity.category && (
            <span className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md whitespace-nowrap">
              {entity.category.name}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.map((et) => (
              <TagBadge 
                key={et.id} 
                name={et.tag.name} 
                category={et.tag.category} 
                verified={et.verified}
                className="text-[10px] px-2 py-0.5"
              />
            ))}
            {entity.tags.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                +{entity.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {entity.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
            {truncate(entity.description, 150)}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-1.5 text-sm text-gray-500 mb-4">
          {entity.address && (
            <p className="flex items-start gap-2">
              <span className="mt-0.5">📍</span>
              <span className="line-clamp-1">{entity.address}</span>
            </p>
          )}
          {entity.phone && (
            <p className="flex items-center gap-2">
              <span>📞</span>
              <span>{entity.phone}</span>
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
