"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PreferencesManager } from "@/components/subscription/PreferencesManager";
import { Card } from "@/components/ui/Card";

function ManagePreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = token
    ? null
    : "Invalid link. Please check your email for the correct management link.";

  return (
    <>
      {error ? (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Link
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you need a new management link, please{" "}
            <Link href="/subscribe" className="text-indigo-600 hover:underline">
              subscribe again
            </Link>
            {" "}or contact us.
          </p>
        </Card>
      ) : token ? (
        <PreferencesManager token={token} />
      ) : (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </Card>
      )}
    </>
  );
}

export default function ManagePreferencesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Update your email preferences or unsubscribe from our mailing list.
          </p>
        </div>

        <Suspense fallback={
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </Card>
        }>
          <ManagePreferencesContent />
        </Suspense>
      </main>
    </div>
  );
}


