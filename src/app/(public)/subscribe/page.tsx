"use client";

import { SubscribeForm } from "@/components/subscription/SubscribeForm";

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscribe to Updates
          </h1>
          <p className="text-lg text-gray-600">
            Stay informed about new businesses, events, and community updates in TahOak Park.
          </p>
        </div>

        <SubscribeForm />
      </main>
    </div>
  );
}


