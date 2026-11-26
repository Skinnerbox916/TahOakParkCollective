"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ListingAgreement } from "@/components/entity/ListingAgreement";
import { useAuth } from "@/lib/use-auth";
import { LISTING_TERMS_VERSION } from "@/lib/entities/policy";

/**
 * Under a shared draft listing: sign in, agree, publish. Or take it over
 * without publishing, to edit it first.
 */
export function PreviewActions({
  token,
  slug,
  alreadyPublished = false,
}: {
  token: string;
  slug: string;
  /** An admin already published it for this owner; they're taking it over. */
  alreadyPublished?: boolean;
}) {
  const t = useTranslations("preview");
  const tAgreement = useTranslations("listingAgreement");
  const router = useRouter();
  const { user, loading } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState<"publish" | "changes" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  async function accept(publish: boolean) {
    setBusy(publish ? "publish" : "changes");
    setError(null);
    try {
      const res = await fetch(`/api/share-links/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish, agreedTermsVersion: publish ? LISTING_TERMS_VERSION : undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t("error"));
      if (publish) setPublished(true);
      else router.push(`/portal/entity/${data.data.entityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setBusy(null);
    }
  }

  if (published) {
    return (
      <Card className="border-success-200 bg-success-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t(alreadyPublished ? "takenOverTitle" : "publishedTitle")}
        </h2>
        <p className="text-gray-700 mb-4">{t(alreadyPublished ? "takenOverText" : "publishedText")}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href={`/entities/${slug}`}>{t("viewListing")}</Button>
          <Button href="/portal/dashboard" variant="outline">
            {t("goToDashboard")}
          </Button>
        </div>
      </Card>
    );
  }

  const callbackUrl = encodeURIComponent(`/preview/${token}`);
  return (
    <Card>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        {t(alreadyPublished ? "takeOverTitle" : "publishTitle")}
      </h2>
      {loading ? null : !user ? (
        <>
          <p className="text-gray-700 mb-4">{t(alreadyPublished ? "signedOutTextLive" : "signedOutText")}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button href={`/auth/signup?callbackUrl=${callbackUrl}`}>{t("createAccount")}</Button>
            <Button href={`/auth/signin?callbackUrl=${callbackUrl}`} variant="outline">
              {t("signIn")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="sr-only">{tAgreement("title")}</h3>
          <ListingAgreement checked={agreed} onChange={setAgreed} disabled={!!busy} />
          {error && (
            <Alert variant="error" className="mt-4">
              {error}
            </Alert>
          )}
          <div className="mt-5 flex flex-col gap-3">
            <Button onClick={() => accept(true)} disabled={!agreed || !!busy} className="w-full sm:w-auto">
              {alreadyPublished
                ? busy === "publish"
                  ? t("takingOver")
                  : t("takeOver")
                : busy === "publish"
                  ? t("publishing")
                  : t("publish")}
            </Button>
            {/* "Changes first" only makes sense before it's public. */}
            {!alreadyPublished && (
              <div>
                <button
                  type="button"
                  onClick={() => accept(false)}
                  disabled={!!busy}
                  className="text-sm text-primary-600 underline disabled:opacity-50"
                >
                  {t("changesFirst")}
                </button>
                <p className="text-xs text-gray-500 mt-1">{t("changesFirstHint")}</p>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
