"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse } from "@/types";

export default function SuggestEntityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    website: "",
    submitterEmail: "",
    submitterName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/public/suggest-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit suggestion");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: "",
        description: "",
        address: "",
        website: "",
        submitterEmail: "",
        submitterName: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit suggestion");
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
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your suggestion has been submitted successfully. Our team will review it and get back to you soon.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/")}>
                Back to Directory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    name: "",
                    description: "",
                    address: "",
                    website: "",
                    submitterEmail: "",
                    submitterName: "",
                  });
                }}
              >
                Suggest Another
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
            Suggest an Entity
          </h1>
          <p className="text-gray-600">
            Know a business or organization that should be in our directory? Let us know!
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Input
                type="text"
                name="name"
                label="Entity Name *"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Business or organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Tell us about this entity..."
              />
            </div>

            <div>
              <Input
                type="text"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                placeholder="Street address"
              />
            </div>

            <div>
              <Input
                type="url"
                name="website"
                label="Website"
                value={formData.website}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://example.com"
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
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Suggestion"}
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

