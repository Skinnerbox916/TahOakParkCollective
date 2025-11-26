"use client";

import { useState, useEffect } from "react";
import { TagCategory } from "@/lib/prismaEnums";
import { TagBadge } from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  category: TagCategory;
}

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch("/api/tags");
        const data = await res.json();
        if (data.success) {
          setAvailableTags(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const groupedTags = availableTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  if (loading) return <div className="text-sm text-gray-500">Loading tags...</div>;

  return (
    <div className="space-y-4">
      {Object.entries(groupedTags).map(([category, tags]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {category.replace("_", " ")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <TagBadge name={tag.name} category={tag.category} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


