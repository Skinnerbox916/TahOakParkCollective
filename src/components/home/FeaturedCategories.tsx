"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { ApiResponse } from "@/types";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  featured: boolean;
  entityCount: number;
}

export function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("home");
  const locale = useLocale();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?locale=${locale}`);
        const data: ApiResponse<Category[]> = await response.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  // Filter to only show categories that have entities
  const categoriesWithEntities = categories.filter((cat) => cat.entityCount > 0);

  if (categoriesWithEntities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t("noCategoriesYet")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categoriesWithEntities.map((category) => (
        <Link
          key={category.id}
          href={`/search?category=${category.slug}`}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {category.name}
          </h3>
          <p className="text-sm text-gray-600">
            {category.entityCount} {category.entityCount === 1 ? t("entity") : t("entities")}
          </p>
        </Link>
      ))}
    </div>
  );
}



