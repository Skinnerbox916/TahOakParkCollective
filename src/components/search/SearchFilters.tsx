"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ENTITY_TYPES } from "@/lib/constants";
import type { EntityType } from "@/lib/prismaEnums";
import type { Category } from "@prisma/client";

interface SearchFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  selectedEntityType: EntityType | "";
  categories: Category[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onEntityTypeChange: (entityType: EntityType | "") => void;
  onClearFilters: () => void;
}

export function SearchFilters({
  searchQuery,
  selectedCategory,
  selectedEntityType,
  categories,
  onSearchChange,
  onCategoryChange,
  onEntityTypeChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const hasActiveFilters =
    localSearchQuery || selectedCategory || selectedEntityType;

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    // Debounce handled in parent component
    onSearchChange(value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="space-y-4" suppressHydrationWarning>
        {/* Search Input */}
        <div>
          <Input
            type="text"
            placeholder="Search entities..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) =>
                onEntityTypeChange((e.target.value || "") as EntityType | "")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {localSearchQuery && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  Search: {localSearchQuery}
                </span>
              )}
              {selectedCategory && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedEntityType && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {ENTITY_TYPES.find((t) => t.value === selectedEntityType)?.label}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

