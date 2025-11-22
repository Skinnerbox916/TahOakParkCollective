"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NEIGHBORHOODS } from "@/lib/constants";
import type { Neighborhood } from "@/lib/prismaEnums";
import type { Category } from "@prisma/client";

interface SearchFiltersProps {
  searchQuery: string;
  selectedNeighborhood: Neighborhood | "";
  selectedCategory: string;
  categories: Category[];
  onSearchChange: (query: string) => void;
  onNeighborhoodChange: (neighborhood: Neighborhood | "") => void;
  onCategoryChange: (categoryId: string) => void;
  onClearFilters: () => void;
}

export function SearchFilters({
  searchQuery,
  selectedNeighborhood,
  selectedCategory,
  categories,
  onSearchChange,
  onNeighborhoodChange,
  onCategoryChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const hasActiveFilters =
    localSearchQuery || selectedNeighborhood || selectedCategory;

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
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <Input
            type="text"
            placeholder="Search businesses..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Neighborhood Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neighborhood
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) =>
                onNeighborhoodChange(
                  (e.target.value || "") as Neighborhood | ""
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Neighborhoods</option>
              {NEIGHBORHOODS.map((neighborhood) => (
                <option key={neighborhood.value} value={neighborhood.value}>
                  {neighborhood.label}
                </option>
              ))}
            </select>
          </div>

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
              {selectedNeighborhood && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {
                    NEIGHBORHOODS.find((n) => n.value === selectedNeighborhood)
                      ?.label
                  }
                </span>
              )}
              {selectedCategory && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {categories.find((c) => c.id === selectedCategory)?.name}
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

