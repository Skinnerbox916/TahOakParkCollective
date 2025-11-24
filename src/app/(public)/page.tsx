"use client";

import Link from "next/link";
import { OmniSearch } from "@/components/home/OmniSearch";
import { FeaturedBusiness } from "@/components/home/FeaturedBusiness";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to TahOak Park Collective
            </h1>
            <p className="text-xl text-indigo-100 mb-6">
              Discover local businesses in your community
            </p>
          </div>
          
          {/* Omni Search - Smaller and less prominent */}
          <div className="max-w-2xl mx-auto">
            <OmniSearch />
          </div>
        </div>
      </section>

      {/* Categories Section - First and most prominent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Browse by Category
          </h2>
          <Link href="/search">
            <Button variant="outline">View All Businesses</Button>
          </Link>
        </div>
        <FeaturedCategories />
      </section>

      {/* Featured Business Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Featured Business
        </h2>
        <div className="max-w-2xl mx-auto">
          <FeaturedBusiness />
        </div>
      </section>

      {/* View Map CTA Section */}
      <section className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Explore on the Map
          </h2>
          <p className="text-gray-600 mb-6">
            See all businesses on an interactive map
          </p>
          <Link href="/search?view=map">
            <Button size="lg">View Map</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
