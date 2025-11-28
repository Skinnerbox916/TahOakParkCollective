"use client";

import { useState } from "react";

export default function QuickAddPage() {
  const [entityName, setEntityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/ai-add-entity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityName: entityName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add entity");
      }

      setSuccess(data.message || `Entity "${entityName}" added successfully! Status: Pending`);
      setEntityName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quick Add Entity</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter an entity name to automatically research and add it to the pending queue.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="entityName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Entity Name <span className="text-red-500">*</span>
            </label>
            <input
              id="entityName"
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g., Oak Park Community Center"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              The system assumes the entity is in the TahOak Park Collective coverage area
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !entityName.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Researching and adding entity...
              </span>
            ) : (
              "Add Entity"
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>AI researches the entity using web search</li>
          <li>Checks for duplicates against existing entities</li>
          <li>Extracts all relevant information (address, phone, website, etc.)</li>
          <li>Creates entity with PENDING status for your review</li>
        </ul>
      </div>
    </div>
  );
}

