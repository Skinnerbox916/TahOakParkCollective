"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiResponse, Category } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LOCAL_TIERS } from "@/lib/constants";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import type { BusinessStatus, LocalTier } from "@/lib/prismaEnums";

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface AdminBusinessFormProps {
  onSuccess?: () => void;
}

export function AdminBusinessForm({ onSuccess }: AdminBusinessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState<BusinessStatus>(BUSINESS_STATUS.PENDING);
  const [localTier, setLocalTier] = useState<LocalTier | "">("");

  // Load categories and users
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesResponse, usersResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/admin/users"),
        ]);

        const categoriesData: ApiResponse<Category[]> = await categoriesResponse.json();
        if (categoriesResponse.ok && categoriesData.success) {
          setCategories(categoriesData.data || []);
        }

        const usersData: ApiResponse<User[]> = await usersResponse.json();
        if (usersResponse.ok && usersData.success) {
          setUsers(usersData.data || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    loadData();
  }, []);

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return "Business name is required";
    }

    if (!ownerId) {
      return "Please select an owner";
    }

    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        return "Please enter a valid website URL (e.g., https://example.com)";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        categoryId: categoryId || undefined,
        ownerId,
        status,
        localTier: localTier || undefined,
      };

      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create business");
      }

      setSuccess("Business created successfully!");
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setTimeout(() => {
          router.push("/admin/businesses");
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating business:", err);
      setError(err instanceof Error ? err.message : "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <Input
            type="text"
            label="Business Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe the business..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              placeholder="Street address"
            />
          </div>

          <div>
            <Input
              type="tel"
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <Input
            type="url"
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
            placeholder="https://example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner *
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select an owner</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email || user.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BusinessStatus)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={BUSINESS_STATUS.PENDING}>Pending</option>
              <option value={BUSINESS_STATUS.ACTIVE}>Active</option>
              <option value={BUSINESS_STATUS.INACTIVE}>Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Tier
            </label>
            <select
              value={localTier}
              onChange={(e) => setLocalTier(e.target.value as LocalTier | "")}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a tier (optional)</option>
              {LOCAL_TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Business"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/businesses")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

