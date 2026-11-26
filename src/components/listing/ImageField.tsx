"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const MAX_BYTES = 8 * 1024 * 1024;

type Pending = { url: string | null } | null;

/**
 * A listing's logo or cover photo. Unlike the rest of the form it saves on
 * its own: choosing a file uploads it. An admin's change applies at once
 * (and moves the listing's version on); an owner's waits for review, and the
 * current image stays until then.
 */
export function ImageField({
  entityId,
  kind,
  url,
  onApplied,
}: {
  entityId: string;
  kind: "logo" | "cover";
  url: string | null;
  onApplied: (version: number) => void;
}) {
  const t = useTranslations("listingEditor");
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(url);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function send(file: File | null) {
    setError(null);
    setSaved(false);
    if (file && file.size > MAX_BYTES) {
      setError(t("validation.image.tooLarge"));
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      if (file) body.append("file", file);
      const response = await fetch(`/api/entities/${entityId}/images/${kind}`, file ? { method: "PUT", body } : { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        const key = Object.values((data.fieldErrors ?? {}) as Record<string, string>)[0];
        const code = response.status === 429 ? "rate_limited" : data.code;
        setError(key && t.has(key) ? t(key) : code && t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.generic"));
        return;
      }
      if (data.data.pending) {
        setPending({ url: data.data.url });
      } else {
        setCurrent(data.data.url);
        setPending(null);
        setSaved(true);
        onApplied(data.data.version);
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const frame = kind === "logo" ? "h-24 w-24" : "aspect-video w-full max-w-sm";
  const fit = kind === "logo" ? "object-contain p-1" : "object-cover";
  const shown = pending?.url ?? current;

  return (
    <div data-field={`${kind}Image`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {t(`images.${kind}`)}
      </label>
      <p className="mb-2 text-xs text-gray-500">{t(`images.${kind}Hint`)}</p>
      <div className="flex flex-wrap items-end gap-4">
        <div className={`${frame} flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50`}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- our own upload, already sized
            <img src={shown} alt={t(`images.${kind}`)} className={`h-full w-full ${fit}`} />
          ) : (
            <span className="px-2 text-center text-xs text-gray-500">{t("images.none")}</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={input}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => send(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? t("images.working") : t(current || pending?.url ? "images.replace" : "images.upload")}
          </Button>
          {current && !pending && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => send(null)}>
              {t("images.remove")}
            </Button>
          )}
        </div>
      </div>
      <p role="status" className="mt-2 text-sm text-gray-600">
        {pending ? t(pending.url ? "images.pendingUpload" : "images.pendingRemoval") : saved ? t("notices.saved") : ""}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
