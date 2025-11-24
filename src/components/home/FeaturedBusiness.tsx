"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EntityWithRelations } from "@/types";
import { ApiResponse } from "@/types";

interface FeaturedBusinessProps {
  rotationInterval?: number; // in milliseconds, default 8000 (8 seconds)
}

export function FeaturedBusiness({ rotationInterval = 8000 }: FeaturedBusinessProps) {
  const [entities, setEntities] = useState<EntityWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEntities = async () => {
      try {
        const response = await fetch("/api/entities/featured");
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
  }, []);

  useEffect(() => {
    if (entities.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % entities.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [entities.length, rotationInterval]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (entities.length === 0) {
    return null;
  }

  const entity = entities[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
          Featured
        </span>
      </div>
      
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{entity.name}</h3>
        {entity.category && (
          <p className="text-indigo-600 font-medium">{entity.category.name}</p>
        )}
      </div>

      {entity.description && (
        <p className="text-gray-600 mb-6 line-clamp-3">{entity.description}</p>
      )}

      <div className="flex items-center justify-between">
        <Link
          href={`/entities/${entity.slug}`}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Learn more →
        </Link>
        
        {entities.length > 1 && (
          <div className="flex gap-2">
            {entities.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-indigo-600" : "bg-gray-300"
                }`}
                aria-label={`Go to featured entity ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



