"use client";

import { useTranslations } from "next-intl";
import { SubscribeForm } from "@/components/subscription/SubscribeForm";

export default function SubscribePage() {
  const t = useTranslations("subscribe");
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("subtitle")}
          </p>
        </div>

        <SubscribeForm />
      </main>
    </div>
  );
}


