"use client";

import { useState } from "react";
import Link from "next/link";
import { BusinessWithRelations } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import type { BusinessStatus } from "@/lib/prismaEnums";
import { formatPhoneNumber } from "@/lib/utils";

interface BusinessTableProps {
  businesses: BusinessWithRelations[];
  onStatusChange?: (businessId: string, newStatus: BusinessStatus) => Promise<void>;
  onFeaturedChange?: (businessId: string, featured: boolean) => Promise<void>;
  onDelete?: (businessId: string) => Promise<void>;
}

export function BusinessTable({ businesses, onStatusChange, onFeaturedChange, onDelete }: BusinessTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);

  const handleStatusChange = async (businessId: string, newStatus: BusinessStatus) => {
    if (!onStatusChange) return;
    
    setUpdating(businessId);
    try {
      await onStatusChange(businessId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update business status");
    } finally {
      setUpdating(null);
    }
  };

  const handleFeaturedToggle = async (businessId: string, currentFeatured: boolean) => {
    if (!onFeaturedChange) return;
    
    setTogglingFeatured(businessId);
    try {
      await onFeaturedChange(businessId, !currentFeatured);
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert("Failed to update featured status");
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!onDelete) return;
    
    if (!confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      return;
    }

    setDeleting(businessId);
    try {
      await onDelete(businessId);
    } catch (error) {
      console.error("Error deleting business:", error);
      alert("Failed to delete business");
    } finally {
      setDeleting(null);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No businesses found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Featured
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {businesses.map((business) => (
            <tr key={business.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <Link
                    href={`/businesses/${business.slug}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    target="_blank"
                  >
                    {business.name}
                  </Link>
                  {business.address && (
                    <p className="text-xs text-gray-500 mt-1">{business.address}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {business.category?.name || "—"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={business.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {onFeaturedChange ? (
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={business.featured || false}
                      onChange={() => handleFeaturedToggle(business.id, business.featured || false)}
                      disabled={togglingFeatured === business.id}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {business.featured ? "Featured" : "Not Featured"}
                    </span>
                  </label>
                ) : (
                  <span className="text-sm text-gray-700">
                    {business.featured ? "Yes" : "No"}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {business.owner?.name || business.owner?.email || "—"}
                </div>
                {business.phone && (
                  <div className="text-xs text-gray-500">
                    {formatPhoneNumber(business.phone)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(business.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {business.status === BUSINESS_STATUS.PENDING && onStatusChange && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusChange(business.id, BUSINESS_STATUS.ACTIVE)}
                        disabled={updating === business.id}
                      >
                        {updating === business.id ? "..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStatusChange(business.id, BUSINESS_STATUS.INACTIVE)}
                        disabled={updating === business.id}
                      >
                        {updating === business.id ? "..." : "Reject"}
                      </Button>
                    </>
                  )}
                  {business.status !== BUSINESS_STATUS.PENDING && onStatusChange && (
                    <select
                      value={business.status}
                      onChange={(e) => handleStatusChange(business.id, e.target.value as BusinessStatus)}
                      disabled={updating === business.id}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={BUSINESS_STATUS.ACTIVE}>Active</option>
                      <option value={BUSINESS_STATUS.PENDING}>Pending</option>
                      <option value={BUSINESS_STATUS.INACTIVE}>Inactive</option>
                    </select>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(business.id)}
                      disabled={deleting === business.id}
                    >
                      {deleting === business.id ? "..." : "Delete"}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
