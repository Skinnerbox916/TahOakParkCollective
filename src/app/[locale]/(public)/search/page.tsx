"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { SearchFilters } from "@/components/search/SearchFilters";
import { EntityList } from "@/components/entity/EntityList";
import { Button } from "@/components/ui/Button";
import { EntityWithRelations, Category, Tag } from "@/types";
import { parseSearchParams, buildSearchUrl, debounce } from "@/lib/search";
import { ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityType } from "@/lib/prismaEnums";
import { SACRAMENTO_CENTER, DEFAULT_ZOOM } from "@/lib/map";

// Loading component for map that uses translations
function MapLoading() {
  const t = useTranslations('search');
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">{t('loadingMap')}</p>
    </div>
  );
}

// Dynamically import map component to avoid SSR issues with Leaflet
const EntityMap = dynamic(
  () => import("@/components/search/EntityMap").then((mod) => mod.EntityMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParams = parseSearchParams(searchParams);
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState(urlParams.q || "");
  const [selectedCategory, setSelectedCategory] = useState(
    urlParams.category || ""
  );
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | "">(
    (urlParams.entityType as EntityType) || ""
  );
  const [viewMode, setViewMode] = useState<"map" | "list">(
    urlParams.view || "list"
  );

  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [allEntities, setAllEntities] = useState<EntityWithRelations[]>([]); // Store unfiltered entities
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories and tags on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/categories?locale=${locale}`);
        const data = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
          
          // If selectedCategory is a slug (not an ID), convert it to ID
          if (selectedCategory && selectedCategory.length < 25) {
            const categoryBySlug = data.data.find(
              (cat: Category) => cat.slug === selectedCategory
            );
            if (categoryBySlug) {
              setSelectedCategory(categoryBySlug.id);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }

    async function fetchTags() {
      try {
        const response = await fetch(`/api/tags?locale=${locale}`);
        const data = await response.json();
        if (data.success && data.data) {
          setTags(data.data as Tag[]);
        }
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    }

    fetchCategories();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (params: {
      q: string;
      category: string;
      entityType: EntityType | "";
    }) => {
      try {
        setIsLoading(true);
        setError(null);

      const queryParams = new URLSearchParams();
      if (params.q) queryParams.set("q", params.q);
      if (params.category) queryParams.set("category", params.category);
      if (params.entityType) queryParams.set("entityType", params.entityType);
      queryParams.set("locale", locale);

      const response = await fetch(`/api/entities?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
          setAllEntities(data.data); // Store all entities
          // Tag filtering happens in useEffect below
        } else {
          setError(data.error || "Failed to fetch entities");
          setAllEntities([]);
          setEntities([]);
        }
      } catch (err) {
        console.error("Error fetching entities:", err);
        setError("An error occurred while fetching entities");
        setEntities([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Fetch entities when filters change (excluding tags - those filter client-side)
  useEffect(() => {
    debouncedSearch({
      q: searchQuery,
      category: selectedCategory,
      entityType: selectedEntityType,
    });
  }, [searchQuery, selectedCategory, selectedEntityType, debouncedSearch, locale]);

  // Filter entities by selected tags (client-side)
  useEffect(() => {
    if (selectedTags.length === 0) {
      setEntities(allEntities);
      return;
    }

    const filtered = allEntities.filter((entity) => {
      if (!entity.tags || !Array.isArray(entity.tags)) return false;
      const entityTagIds = (entity.tags as any[]).map((et: any) => et.tag?.id || et.tagId);
      // Entity must have ALL selected tags
      return selectedTags.every((tagId) => entityTagIds.includes(tagId));
    });
    setEntities(filtered);
  }, [allEntities, selectedTags]);

  // Sync URL with state changes
  useEffect(() => {
    const newParams = buildSearchUrl({
      q: searchQuery || undefined,
      category: selectedCategory || undefined,
      entityType: selectedEntityType || undefined,
      view: viewMode,
    });

    const currentUrl = searchParams.toString();
    const newUrl = newParams.replace(/^\?/, "");

    if (currentUrl !== newUrl) {
      router.replace(newParams || "/search", { scroll: false });
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedEntityType,
    viewMode,
    router,
    searchParams,
  ]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedEntityType("");
    setSelectedTags([]);
    setViewMode("list");
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleEntityTypeChange = (entityType: EntityType | "") => {
    setSelectedEntityType(entityType);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "map" ? "list" : "map"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Filters */}
        <div className="mb-6">
          <SearchFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedEntityType={selectedEntityType}
            selectedTags={selectedTags}
            categories={categories}
            tags={tags}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onEntityTypeChange={handleEntityTypeChange}
            onTagsChange={handleTagsChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* View Toggle and Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span>{t('searching')}</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span>
                {t('found', { count: entities.length })}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === "map" ? t('showList') : t('showMap')}
          </Button>
        </div>

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Map or List View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {viewMode === "map" ? (
            <>
              <div className="lg:col-span-2">
                <EntityMap
                  entities={entities}
                  center={SACRAMENTO_CENTER}
                  zoom={DEFAULT_ZOOM}
                />
              </div>
            </>
          ) : (
            <>
              {/* Desktop: Show both map and list side by side */}
              <div className="hidden lg:block">
                <EntityMap
                  entities={entities}
                  center={SACRAMENTO_CENTER}
                  zoom={DEFAULT_ZOOM}
                />
              </div>
              <div className="lg:col-span-1">
                <EntityList entities={entities} isLoading={isLoading} />
              </div>
            </>
          )}
        </div>

        {/* Mobile: Show map below list when in list view */}
        {viewMode === "list" && (
          <div className="lg:hidden mt-6">
            <EntityMap
              entities={entities}
              center={SACRAMENTO_CENTER}
              zoom={DEFAULT_ZOOM}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function SearchPageFallback() {
  const tCommon = useTranslations('common');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{tCommon('loading')}</p>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}


