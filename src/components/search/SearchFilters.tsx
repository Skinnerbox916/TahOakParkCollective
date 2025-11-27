"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ENTITY_TYPES } from "@/lib/constants";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import type { EntityType } from "@/lib/prismaEnums";
import type { Category } from "@prisma/client";
import { TagBadge } from "@/components/tags/TagBadge";
import type { TagCategory } from "@/lib/prismaEnums";

interface Tag {
  id: string;
  name: string;
  category: TagCategory;
}

interface SearchFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  selectedEntityType: EntityType | "";
  selectedTags: string[];
  categories: Category[];
  tags?: Tag[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onEntityTypeChange: (entityType: EntityType | "") => void;
  onTagsChange: (tagIds: string[]) => void;
  onClearFilters: () => void;
}

export function SearchFilters({
  searchQuery,
  selectedCategory,
  selectedEntityType,
  selectedTags,
  categories,
  tags = [],
  onSearchChange,
  onCategoryChange,
  onEntityTypeChange,
  onTagsChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [tagSearch, setTagSearch] = useState("");
  const [showTags, setShowTags] = useState(false);
  const t = useTranslations("search");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  const entityTypeLabels = useEntityTypeLabels();
  
  const hasActiveFilters =
    localSearchQuery || selectedCategory || selectedEntityType || selectedTags.length > 0;

  // Filter categories based on selected entity type
  const filteredCategories = useMemo(() => {
    if (!selectedEntityType) {
      return categories;
    }
    return categories.filter(
      (cat) => cat.entityTypes && cat.entityTypes.includes(selectedEntityType)
    );
  }, [categories, selectedEntityType]);

  // Filter tags by search
  const filteredTags = useMemo(() => {
    if (!tagSearch) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [tags, tagSearch]);

  // Group tags by category
  const groupedTags = useMemo(() => {
    return filteredTags.reduce((acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag);
      return acc;
    }, {} as Record<TagCategory, Tag[]>);
  }, [filteredTags]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Clear selected category if it's not valid for the current entity type
  useEffect(() => {
    if (selectedCategory && selectedEntityType) {
      const currentCategory = categories.find((c) => c.id === selectedCategory);
      if (
        currentCategory &&
        (!currentCategory.entityTypes ||
          !currentCategory.entityTypes.includes(selectedEntityType))
      ) {
        onCategoryChange("");
      }
    }
  }, [selectedEntityType, selectedCategory, categories, onCategoryChange]);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    // Debounce handled in parent component
    onSearchChange(value);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const selectedTagsData = tags.filter(t => selectedTags.includes(t.id));

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="space-y-4" suppressHydrationWarning>
        {/* Search Input */}
        <div>
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("entityType")}
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) =>
                onEntityTypeChange((e.target.value || "") as EntityType | "")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t("allTypes")}</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {entityTypeLabels[type.value]}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("category")}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">{t("allCategories")}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("tags")}
            </label>
            <button
              type="button"
              onClick={() => setShowTags(!showTags)}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              {showTags ? t("hideTags") : t("showTags")}
            </button>
          </div>
          
          {/* Selected Tags */}
          {selectedTagsData.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTagsData.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="inline-flex items-center gap-1"
                >
                  <TagBadge name={tag.name} category={tag.category} />
                  <span className="text-xs text-gray-400">×</span>
                </button>
              ))}
            </div>
          )}

          {/* Tag Selector Dropdown */}
          {showTags && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <input
                type="text"
                placeholder={t("searchTags")}
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="space-y-3">
                {Object.entries(groupedTags).map(([category, categoryTags]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {category.replace("_", " ")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`transition-opacity ${
                              isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            <TagBadge 
                              name={tag.name} 
                              category={tag.category}
                              className={isSelected ? "ring-2 ring-indigo-500" : ""}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {localSearchQuery && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {tCommon("search")}: {localSearchQuery}
                </span>
              )}
              {selectedCategory && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {filteredCategories.find((c) => c.id === selectedCategory)?.name ||
                    categories.find((c) => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedEntityType && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                  {entityTypeLabels[selectedEntityType]}
                </span>
              )}
              {selectedTagsData.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  category={tag.category}
                  className="text-xs"
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              {tCommon("clear")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
