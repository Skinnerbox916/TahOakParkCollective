"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse, EntityWithRelations } from "@/types";
import { IssueType } from "@/lib/prismaEnums";
import Link from "next/link";

const ISSUE_TYPES: { value: IssueType; label: string; description: string }[] = [
  { value: IssueType.INCORRECT_INFO, label: "Incorrect Information", description: "Wrong address, phone, hours, etc." },
  { value: IssueType.CLOSED, label: "Closed/Permanently Closed", description: "This business is no longer operating" },
  { value: IssueType.INELIGIBLE, label: "Not Eligible", description: "Doesn't meet directory criteria" },
  { value: IssueType.OTHER, label: "Other Issue", description: "Something else that needs attention" },
];

export default function ReportIssuePage() {
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
    issueType: IssueType.INCORRECT_INFO as IssueType,
    description: "",
    submitterEmail: "",
    submitterName: "",
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
      setError("Please select an entity to report");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/public/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess(true);
      setFormData({
        entityId: "",
        issueType: IssueType.INCORRECT_INFO,
        description: "",
        submitterEmail: "",
        submitterName: "",
      });
      setEntity(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Report Submitted
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for helping us maintain accurate information. Our team will review your report.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/")}>
                Back to Directory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setShowEntitySearch(true);
                  setEntity(null);
                }}
              >
                Report Another Issue
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report an Issue
          </h1>
          <p className="text-gray-600">
            Found incorrect information or have concerns about a listing? Let us know!
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

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Please describe the issue in detail..."
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Your Contact Information
              </h3>

              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    name="submitterEmail"
                    label="Your Email *"
                    value={formData.submitterEmail}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Input
                    type="text"
                    name="submitterName"
                    label="Your Name (Optional)"
                    value={formData.submitterName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.entityId}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Report"}
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
      </main>
    </div>
  );
}

