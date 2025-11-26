"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse, EntityWithRelations } from "@/types";
import Link from "next/link";

function ClaimEntityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EntityWithRelations[]>([]);
  const [showEntitySearch, setShowEntitySearch] = useState(!entityId);
  
  const [formData, setFormData] = useState({
    entityId: entityId || "",
    email: "",
    name: "",
    reason: "",
  });

  // Load entity if entityId is in URL
  useEffect(() => {
    if (entityId) {
      fetch(`/api/entities/${entityId}`)
        .then((res) => res.json())
        .then((data: ApiResponse<EntityWithRelations>) => {
          if (data.success && data.data) {
            setEntity(data.data);
            setFormData((prev) => ({ ...prev, entityId: entityId }));
          }
        })
        .catch(console.error);
    }
  }, [entityId]);

  // Search entities
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/entities?q=${encodeURIComponent(searchQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data: ApiResponse<EntityWithRelations[]>) => {
          if (data.success && data.data) {
            setSearchResults(data.data);
          }
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectEntity = (selectedEntity: EntityWithRelations) => {
    setEntity(selectedEntity);
    setFormData((prev) => ({ ...prev, entityId: selectedEntity.id }));
    setShowEntitySearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.entityId) {
      setError("Please select an entity to claim");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/public/claim-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          entityId: formData.entityId,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit claim request");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit claim request");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          We've sent a verification email to <strong>{formData.email}</strong>.
          <br />
          Click the link in the email to verify your claim request.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/")}>
            Back to Directory
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Claim an Entity
        </h1>
        <p className="text-gray-600">
          Are you the owner of this business or organization? Claim it to manage your listing.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Entity Selection */}
          {showEntitySearch ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Find the Entity *
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a business or organization..."
                  className="w-full"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectEntity(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {result.address && (
                          <div className="text-sm text-gray-500">{result.address}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : entity ? (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{entity.name}</div>
                  {entity.address && (
                    <div className="text-sm text-gray-600">{entity.address}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEntitySearch(true);
                    setEntity(null);
                    setFormData((prev) => ({ ...prev, entityId: "" }));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Change
                </button>
              </div>
            </div>
          ) : null}

          {/* Contact Information */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Information
            </h3>

            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  name="email"
                  label="Your Email *"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Input
                  type="text"
                  name="name"
                  label="Your Name (Optional)"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Your name"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Note:</strong> After you submit this form, you'll receive a verification email.
            Once you verify your email, an admin will review your claim request.
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.entityId || !formData.email}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Claim Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

export default function ClaimEntityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense fallback={
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </Card>
        }>
          <ClaimEntityContent />
        </Suspense>
      </main>
    </div>
  );
}
