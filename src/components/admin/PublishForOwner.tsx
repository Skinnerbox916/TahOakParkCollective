"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { useAdminTranslations } from "@/lib/admin-translations";
import { CONSENT_METHODS, LISTING_TERMS_VERSION } from "@/lib/entities/policy";
import type { ApiResponse } from "@/types";

const POINTS = ["represent", "display", "identity", "unpublish"] as const;

/**
 * Admin: publish a listing for an owner who agreed offline and doesn't want
 * an account, recording who agreed and how. Once there's an agreement on
 * record (the owner's own or one recorded here), the admin can also withdraw
 * it when the owner asks to come off the site.
 */
export function PublishForOwner({
  entityId,
  entityName,
  consented,
  onChanged,
}: {
  entityId: string;
  entityName: string;
  consented: boolean;
  onChanged: () => void;
}) {
  const { t } = useAdminTranslations("entities");
  const tAgreement = useTranslations("listingAgreement");
  const [open, setOpen] = useState(false);
  const [givenBy, setGivenBy] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Fixing a field clears its message right away, not on the next submit.
  const clearError = (field: string) =>
    setErrors((current) => {
      if (!(field in current)) return current;
      const rest = { ...current };
      delete rest[field];
      return rest;
    });

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t("share.onBehalf.error"));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("share.onBehalf.error"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    // The button stays enabled; what's missing is shown on its field.
    const found: Record<string, string> = {};
    if (givenBy.trim().length < 2) found.givenBy = t("share.onBehalf.errors.givenBy");
    if (!method) found.method = t("share.onBehalf.errors.method");
    if (note.length > 1000) found.note = t("share.onBehalf.errors.note");
    if (!confirmed) found.confirm = t("share.onBehalf.errors.confirm");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const ok = await post(`/api/admin/entities/${entityId}/publish-on-behalf`, {
      givenBy,
      method,
      note,
      agreedTermsVersion: LISTING_TERMS_VERSION,
    });
    if (ok) {
      setOpen(false);
      onChanged();
    }
  }

  async function withdraw() {
    if (!confirm(t("share.onBehalf.withdrawConfirm", { name: entityName }))) return;
    if (await post(`/api/entities/${entityId}/unpublish`, { withdrawConsent: true })) onChanged();
  }

  if (consented) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        {error && <p className="mb-2 text-sm text-error-600">{error}</p>}
        <Button variant="outline" size="sm" onClick={withdraw} disabled={busy}>
          {t("share.onBehalf.withdraw")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{t("share.onBehalf.heading")}</h3>
      <p className="text-sm text-gray-500 mb-3">{t("share.onBehalf.text")}</p>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("share.onBehalf.open")}
      </Button>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title={t("share.onBehalf.title")} maxWidth="xl">
        <form onSubmit={publish} className="space-y-4" noValidate>
          <div className="text-sm text-gray-700">
            <p className="mb-2">{tAgreement("onBehalfIntro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              {POINTS.map((point) => (
                <li key={point}>{tAgreement(point)}</li>
              ))}
            </ul>
          </div>
          <Input
            label={`${t("share.onBehalf.givenBy")} *`}
            value={givenBy}
            onChange={(e) => {
              setGivenBy(e.target.value);
              clearError("givenBy");
            }}
            placeholder={t("share.onBehalf.givenByPlaceholder")}
            maxLength={200}
            error={errors.givenBy}
          />
          <Select
            label={`${t("share.onBehalf.method")} *`}
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              clearError("method");
            }}
            error={errors.method}
          >
            <option value="">{t("share.onBehalf.chooseMethod")}</option>
            {CONSENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`share.onBehalf.methods.${m}`)}
              </option>
            ))}
          </Select>
          <Textarea
            label={t("share.onBehalf.note")}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              clearError("note");
            }}
            placeholder={t("share.onBehalf.notePlaceholder")}
            rows={2}
            error={errors.note}
          />
          <div>
            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus-ring"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  clearError("confirm");
                }}
              />
              <span>{t("share.onBehalf.confirm")}</span>
            </label>
            {errors.confirm && <p className="mt-1 text-sm text-error-600">{errors.confirm}</p>}
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {t("share.onBehalf.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("share.onBehalf.publishing") : t("share.onBehalf.publish")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
