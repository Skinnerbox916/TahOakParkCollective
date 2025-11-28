"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TagCategory } from "@/lib/prismaEnums";
import { TagBadge } from "@/components/tags/TagBadge";
import { Button } from "@/components/ui/Button";
import { useTranslate } from "@/hooks/useTranslate";

interface Tag {
  id: string;
  name: string;
  category: TagCategory;
}

export function TagManager() {
  const t = useTranslations("tags");
  const tCommon = useTranslations("common");
  const { translate, isTranslating } = useTranslate();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameEs, setNewNameEs] = useState("");
  const [newCategory, setNewCategory] = useState<TagCategory>("AMENITY");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAutoTranslate = async (direction: 'en-to-es' | 'es-to-en') => {
    if (direction === 'en-to-es' && newNameEn) {
      const translated = await translate(newNameEn, 'es', 'en');
      setNewNameEs(translated);
    } else if (direction === 'es-to-en' && newNameEs) {
      const translated = await translate(newNameEs, 'en', 'es');
      setNewNameEn(translated);
    }
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newNameEn || !newNameEs) {
      setError(t("bothLanguagesRequired"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameTranslations: { en: newNameEn, es: newNameEs },
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTags([...tags, data.data]);
        setNewNameEn("");
        setNewNameEs("");
        setError(null);
      } else {
        setError(data.error || t("failedToCreate"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCreate"));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(tagId: string) {
    if (!confirm(t("deleteConfirmation"))) {
      return;
    }

    setDeleting(tagId);
    setError(null);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setTags(tags.filter((t) => t.id !== tagId));
        setError(null);
      } else {
        setError(data.error || t("failedToDelete"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToDelete"));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div>{t("loading")}</div>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t("createNewTag")}</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tagNameEnglish")} *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g. WiFi, Black-owned"
                />
                <button
                  type="button"
                  onClick={() => handleAutoTranslate('en-to-es')}
                  disabled={isTranslating || !newNameEn}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t("translateToSpanish")}
                >
                  → ES
                </button>
              </div>
            </div>

            {/* Spanish Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tagNameSpanish")} *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAutoTranslate('es-to-en')}
                  disabled={isTranslating || !newNameEs}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t("translateToEnglish")}
                >
                  EN ←
                </button>
                <input
                  type="text"
                  value={newNameEs}
                  onChange={(e) => setNewNameEs(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="ej. WiFi, Negocio Afroamericano"
                />
              </div>
            </div>
          </div>

          {/* Category selector and submit button */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("category")}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TagCategory)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                {Object.values(TagCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              type="submit" 
              disabled={creating || !newNameEn || !newNameEs}
            >
              {creating ? t("creating") : t("createTag")}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("category")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("preview")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tag.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tag.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TagBadge name={tag.name} category={tag.category} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(tag.id)}
                    disabled={deleting === tag.id}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {deleting === tag.id ? t("deleting") : t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


