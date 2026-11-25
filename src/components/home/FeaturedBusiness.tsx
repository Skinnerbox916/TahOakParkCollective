"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { EntityWithRelations } from "@/types";
import { ApiResponse } from "@/types";

interface FeaturedBusinessProps {
  rotationInterval?: number; // in milliseconds, default 8000 (8 seconds)
}

export function FeaturedBusiness({ rotationInterval = 8000 }: FeaturedBusinessProps) {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("home");
  const locale = useLocale();

  useEffect(() => {
    const fetchFeaturedEntities = async () => {
      try {
        const response = await fetch(`/api/entities/featured?locale=${locale}`);
        const data: ApiResponse<EntityWithRelations[]> = await response.json();
        if (data.success && data.data) {
          setEntities(data.data);
          if (data.data.length > 0) {
            setCurrentIndex(0);
          }
        }
      } catch (error) {
        console.error("Error fetching featured entities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedEntities();
  }, [locale]);

  useEffect(() => {
    if (entities.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entities.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [entities.length, rotationInterval]);

  // The whole section, heading included, only appears when something is featured.
  if (isLoading || entities.length === 0) {
    return null;
  }

  const entity = entities[currentIndex];
  const displayName = entity.nameLocalized ?? entity.name;
  const displayDescription = entity.descriptionLocalized ?? entity.description;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t("featuredBusiness")}</h2>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full">
              {t("featured")}
            </span>
          </div>
      
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h3>
            {entity.categories?.length > 0 && (
              <p className="text-primary-600 font-medium">
                {entity.categories.map((cat: any) => cat.nameLocalized ?? cat.name).join(", ")}
              </p>
            )}
          </div>

          {displayDescription && (
            <p className="text-gray-600 mb-6 line-clamp-3">{displayDescription}</p>
          )}

          <div className="flex items-center justify-between">
            <Link
              href={`/entities/${entity.slug}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("learnMore")}
            </Link>
        
            {entities.length > 1 && (
              <div className="flex gap-2">
                {entities.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-primary-600" : "bg-gray-300"
                    }`}
                    aria-label={`Go to featured entity ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
