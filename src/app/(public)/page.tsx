"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFilters } from "@/components/search/SearchFilters";
import { BusinessList } from "@/components/search/BusinessList";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { BusinessWithRelations, Category } from "@/types";
import { parseSearchParams, buildSearchUrl, debounce } from "@/lib/search";

// Use string literal type instead of Prisma enum
type Neighborhood = "TAHOE_PARK" | "OAK_PARK" | "ELMHURST" | "COLONIAL_PARK" | "CURTIS_PARK";
import { SACRAMENTO_CENTER, DEFAULT_ZOOM } from "@/lib/map";

// Dynamically import map component to avoid SSR issues with Leaflet
const BusinessMap = dynamic(
  () => import("@/components/search/BusinessMap").then((mod) => mod.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParams = parseSearchParams(searchParams);

  const [searchQuery, setSearchQuery] = useState(urlParams.q || "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<
    Neighborhood | ""
  >(urlParams.neighborhood || "");
  const [selectedCategory, setSelectedCategory] = useState(
    urlParams.category || ""
  );
  const [viewMode, setViewMode] = useState<"map" | "list">(
    urlParams.view || "list"
  );

  const [businesses, setBusinesses] = useState<BusinessWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (params: {
      q: string;
      neighborhood: Neighborhood | "";
      category: string;
    }) => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (params.q) queryParams.set("q", params.q);
        if (params.neighborhood) queryParams.set("neighborhood", params.neighborhood);
        if (params.category) queryParams.set("category", params.category);

        const response = await fetch(`/api/businesses?${queryParams.toString()}`);
        const data = await response.json();

        if (data.success && data.data) {
          setBusinesses(data.data);
        } else {
          setError(data.error || "Failed to fetch businesses");
          setBusinesses([]);
        }
      } catch (err) {
        console.error("Error fetching businesses:", err);
        setError("An error occurred while fetching businesses");
        setBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Fetch businesses when filters change
  useEffect(() => {
    debouncedSearch({
      q: searchQuery,
      neighborhood: selectedNeighborhood,
      category: selectedCategory,
    });
  }, [searchQuery, selectedNeighborhood, selectedCategory, debouncedSearch]);

  // Sync URL with state changes
  useEffect(() => {
    const newParams = buildSearchUrl({
      q: searchQuery || undefined,
      neighborhood: selectedNeighborhood || undefined,
      category: selectedCategory || undefined,
      view: viewMode,
    });

    const currentUrl = searchParams.toString();
    const newUrl = newParams.replace(/^\?/, "");

    if (currentUrl !== newUrl) {
      router.replace(newParams || "/", { scroll: false });
    }
  }, [
    searchQuery,
    selectedNeighborhood,
    selectedCategory,
    viewMode,
    router,
    searchParams,
  ]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedNeighborhood("");
    setSelectedCategory("");
    setViewMode("list");
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleNeighborhoodChange = (neighborhood: Neighborhood | "") => {
    setSelectedNeighborhood(neighborhood);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "map" ? "list" : "map"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Local Businesses
          </h1>
          <p className="text-gray-600">
            Discover businesses in Tahoe Park, Oak Park, Elmhurst, Colonial
            Park, and Curtis Park
          </p>
        </div>

        {/* Search Filters */}
        <div className="mb-6">
          <SearchFilters
            searchQuery={searchQuery}
            selectedNeighborhood={selectedNeighborhood}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={handleSearchChange}
            onNeighborhoodChange={handleNeighborhoodChange}
            onCategoryChange={handleCategoryChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* View Toggle and Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span>Searching...</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span>
                {businesses.length} {businesses.length === 1 ? "business" : "businesses"} found
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === "map" ? "Show List" : "Show Map"}
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
                <BusinessMap
                  businesses={businesses}
                  center={SACRAMENTO_CENTER}
                  zoom={DEFAULT_ZOOM}
                />
              </div>
            </>
          ) : (
            <>
              {/* Desktop: Show both map and list side by side */}
              <div className="hidden lg:block">
                <BusinessMap
                  businesses={businesses}
                  center={SACRAMENTO_CENTER}
                  zoom={DEFAULT_ZOOM}
                />
              </div>
              <div className="lg:col-span-1">
                <BusinessList businesses={businesses} isLoading={isLoading} />
              </div>
            </>
          )}
        </div>

        {/* Mobile: Show map below list when in list view */}
        {viewMode === "list" && (
          <div className="lg:hidden mt-6">
            <BusinessMap
              businesses={businesses}
              center={SACRAMENTO_CENTER}
              zoom={DEFAULT_ZOOM}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
