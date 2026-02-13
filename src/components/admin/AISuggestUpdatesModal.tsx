"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { EntityWithRelations } from "@/types";
import { useAdminTranslations } from "@/lib/admin-translations";

type SuggestionConfidence = "high" | "medium" | "low";

interface Suggestion {
  field: string;
  fieldLabel?: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reasoning?: string;
  confidence?: SuggestionConfidence;
  accepted?: boolean;
}

interface AISuggestUpdatesModalProps {
  entity: EntityWithRelations;
  open: boolean;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  address: "Address",
  phone: "Phone",
  website: "Website",
  entityType: "Entity Type",
  categorySlugs: "Categories",
  tagSlugs: "Tags",
  hours: "Hours",
  socialMedia: "Social Media",
  nameTranslations: "Name Translations",
  descriptionTranslations: "Description Translations",
  seoTitleTranslations: "SEO Title Translations",
  seoDescriptionTranslations: "SEO Description Translations",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return value || "(empty)";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "(empty)";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AISuggestUpdatesModal({ entity, open, onClose }: AISuggestUpdatesModalProps) {
  const router = useRouter();
  const { t } = useAdminTranslations("entities");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptedCount = useMemo(
    () => suggestions.filter((s) => s.accepted).length,
    [suggestions]
  );

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setSuggestions([]);
      setError(null);
      setGenerating(false);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const loadSuggestions = async () => {
      setGenerating(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/entities/${entity.id}/ai-suggest-updates`, {
          signal: abortController.signal,
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load suggestions");
        }

        const incoming: Suggestion[] = (data.data?.suggestions || []).map((s: Suggestion) => ({
          ...s,
          fieldLabel: s.fieldLabel || FIELD_LABELS[s.field] || s.field,
          accepted: false,
        }));

        if (isMounted) {
          setSuggestions(incoming);
        }
      } catch (err) {
        // Don't show error if request was aborted (user cancelled)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load suggestions");
        }
      } finally {
        if (isMounted) setGenerating(false);
      }
    };

    loadSuggestions();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [open, entity.id]);

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const setAll = (accepted: boolean) => {
    setSuggestions((prev) => 
      prev.map((s) => ({ ...s, accepted }))
    );
  };

  const handleSubmit = async () => {
    const accepted = suggestions.filter((s) => s.accepted);
    if (accepted.length === 0) {
      setError(t("aiSuggestModal.errorRequireSelection"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/entities/${entity.id}/ai-suggest-updates/create-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acceptedSuggestions: accepted.map((s) => ({
              field: s.field,
              suggestedValue: s.suggestedValue,
            })),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("aiSuggestModal.errorCreate"));
      }

      const approvalId = data.data?.approvalId;
      if (approvalId) {
        router.push(`/admin/approvals/${approvalId}`);
      } else {
        throw new Error(t("aiSuggestModal.errorMissingApprovalId"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiSuggestModal.errorCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("aiSuggestModal.title")}
      maxWidth="2xl"
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("aiSuggestModal.actions.cancel")}
          </Button>
          {suggestions.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAll(false);
                }}
                disabled={submitting || generating}
              >
                {t("aiSuggestModal.actions.rejectAll")}
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAll(true);
                }}
                disabled={submitting || generating}
              >
                {t("aiSuggestModal.actions.acceptAll")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || generating || acceptedCount === 0}
              >
                {submitting
                  ? t("aiSuggestModal.actions.creatingApproval")
                  : t("aiSuggestModal.actions.createApproval")}
              </Button>
            </>
          )}
        </>
      }
    >
      {generating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("aiSuggestModal.loading")}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {!generating && !error && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <p className="mb-2">{t("aiSuggestModal.noSuggestions")}</p>
        </div>
      )}

      {!generating && suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t("aiSuggestModal.intro")}</p>
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={`${suggestion.field}-${index}`}
              suggestion={suggestion}
              onToggle={() => toggleSuggestion(index)}
              confidenceLabel={t("aiSuggestModal.confidence")}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function SuggestionCard({
  suggestion,
  onToggle,
  confidenceLabel,
}: {
  suggestion: Suggestion;
  onToggle: () => void;
  confidenceLabel: string;
}) {
  const badgeColor =
    suggestion.confidence === "high"
      ? "bg-green-100 text-green-800"
      : suggestion.confidence === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : suggestion.confidence === "low"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
        suggestion.accepted ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div>
          <div className="font-medium text-gray-900">{suggestion.fieldLabel || suggestion.field}</div>
          {suggestion.reasoning && (
            <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
          )}
          {suggestion.confidence && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
              {`${confidenceLabel}: ${suggestion.confidence}`}
            </span>
          )}
        </div>
        <input
          type="checkbox"
          checked={!!suggestion.accepted}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Current</div>
          <div className="p-2 bg-gray-100 rounded whitespace-pre-wrap break-words">
            {formatValue(suggestion.currentValue)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Suggested</div>
          <div className="p-2 bg-indigo-50 rounded whitespace-pre-wrap break-words">
            {formatValue(suggestion.suggestedValue)}
          </div>
        </div>
      </div>
    </div>
  );
}

