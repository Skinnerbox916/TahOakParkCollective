"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAdminTranslations } from "@/lib/admin-translations";
import { CONSENT_METHODS, requiresConsent, type ConsentMethod } from "@/lib/entities/policy";
import { PublishForOwner } from "./PublishForOwner";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import type { ApiResponse } from "@/types";

type LinkState = "open" | "used" | "revoked" | "expired";

interface ShareLink {
  id: string;
  sentTo: string | null;
  locale: string;
  createdAt: string;
  expiresAt: string;
  state: LinkState;
}

const STATE_BADGE: Record<LinkState, "success" | "neutral" | "warning" | "error"> = {
  open: "success",
  used: "neutral",
  revoked: "error",
  expired: "warning",
};

/**
 * Admin: whether the listing is published with its owner's agreement, and
 * private links that hand the draft to its owner by text or email.
 */
export function SharePanel({
  entityId,
  entityType,
  status,
  entityName,
  consentedAt,
  consentTermsVersion,
  consentGivenBy,
  consentMethod,
  onChanged,
}: {
  entityId: string;
  entityType: string;
  status: string;
  entityName: string;
  consentedAt: string | null;
  consentTermsVersion: string | null;
  /** Set when an admin published it for an owner who agreed offline. */
  consentGivenBy: string | null;
  consentMethod: string | null;
  /** The listing's status or consent changed: reload it. */
  onChanged: () => void;
}) {
  const { t } = useAdminTranslations("entities");
  const pageLocale = useLocale();
  const [links, setLinks] = useState<ShareLink[] | null>(null);
  const [locale, setLocale] = useState<"en" | "es">("en");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ url: string; emailedTo: string | null; emailFailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const needsOwner = requiresConsent(entityType);

  async function call<T>(method: "GET" | "POST" | "DELETE", query = "", body?: unknown): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/entities/${entityId}/share-links${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data: ApiResponse<T> = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t("share.error"));
      return data.data ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("share.error"));
      return null;
    } finally {
      setBusy(false);
    }
  }

  const refresh = async () => setLinks((await call<ShareLink[]>("GET")) ?? []);

  useEffect(() => {
    if (!needsOwner) return;
    let cancelled = false;
    fetch(`/api/admin/entities/${entityId}/share-links`)
      .then((res) => res.json() as Promise<ApiResponse<ShareLink[]>>)
      .then((data) => {
        if (cancelled) return;
        if (data.success) setLinks(data.data ?? []);
        else setError(data.error || t("share.error"));
      })
      .catch(() => !cancelled && setError(t("share.error")));
    return () => {
      cancelled = true;
    };
  }, [entityId, needsOwner, t]);

  async function create(sendTo: string | null) {
    const result = await call<{ url: string; emailed: boolean }>("POST", "", { email: sendTo, locale });
    if (!result) return;
    setCreated({ url: result.url, emailedTo: result.emailed ? sendTo : null, emailFailed: !!sendTo && !result.emailed });
    setCopied(false);
    if (result.emailed) setEmail("");
    await refresh();
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(pageLocale, { dateStyle: "medium" });

  let summary: string;
  if (!needsOwner) summary = t("share.exempt");
  else if (consentedAt && status === ENTITY_STATUS.ACTIVE && consentGivenBy)
    summary = t("share.publishedOnBehalf", {
      date: date(consentedAt),
      name: consentGivenBy,
      method: CONSENT_METHODS.includes(consentMethod as ConsentMethod)
        ? t(`share.onBehalf.methods.${consentMethod}`)
        : (consentMethod ?? "?"),
      version: consentTermsVersion ?? "?",
    });
  else if (consentedAt && status === ENTITY_STATUS.ACTIVE)
    summary = t("share.published", { date: date(consentedAt), version: consentTermsVersion ?? "?" });
  else if (consentedAt) summary = t("share.hiddenByAdmin", { date: date(consentedAt) });
  else summary = t("share.draft");

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{t("share.title")}</h2>
      <p className="text-sm text-gray-700 mb-4">{summary}</p>
      {needsOwner && (
        <>
          <p className="text-sm text-gray-500 mb-4">{t("share.description")}</p>
          {error && <p className="mb-3 text-sm text-error-600">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              {t("share.language")}
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value === "es" ? "es" : "en")}
                disabled={busy}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>
            <Button variant="outline" onClick={() => create(null)} disabled={busy}>
              {t("share.createLink")}
            </Button>
          </div>
          <form
            className="flex flex-col sm:flex-row gap-2 mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              create(email.trim());
            }}
          >
            <div className="flex-1">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("share.emailPlaceholder")}
                disabled={busy}
                required
              />
            </div>
            <Button type="submit" disabled={busy || !email.trim()}>
              {t("share.emailIt")}
            </Button>
          </form>

          {created && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              {created.emailedTo && <p className="mb-2 text-success-700">{t("share.emailed", { email: created.emailedTo })}</p>}
              <p className="mb-2 text-gray-700">{created.emailFailed ? t("share.emailFailed") : t("share.linkReady")}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={created.url}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-xs"
                  aria-label={t("share.linkReady")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(created.url).catch(() => {});
                    setCopied(true);
                  }}
                >
                  {copied ? t("share.copied") : t("share.copy")}
                </Button>
              </div>
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("share.links")}</h3>
          {links === null ? null : links.length === 0 ? (
            <p className="text-sm text-gray-600">{t("share.noLinks")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {links.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-gray-700">
                    <Badge variant={STATE_BADGE[link.state]} size="sm">
                      {t(`share.states.${link.state}`)}
                    </Badge>{" "}
                    {t("share.createdOn", { date: date(link.createdAt) })}
                    {link.sentTo && <> · {t("share.sentTo", { email: link.sentTo })}</>} · {link.locale.toUpperCase()}
                  </span>
                  {link.state === "open" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const updated = await call<ShareLink[]>("DELETE", `?linkId=${encodeURIComponent(link.id)}`);
                        if (updated) setLinks(updated);
                      }}
                      className="text-error-600 hover:text-error-800 disabled:opacity-50"
                    >
                      {t("share.revoke")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <PublishForOwner
            entityId={entityId}
            entityName={entityName}
            consented={!!consentedAt}
            onChanged={onChanged}
          />
        </>
      )}
    </Card>
  );
}
