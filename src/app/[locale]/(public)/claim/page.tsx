"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiResponse, EntityWithRelations } from "@/types";
import { Link } from "@/i18n/routing";

function ClaimEntityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");
  const t = useTranslations("claim");
  const tCommon = useTranslations("common");
  const { session, loading: sessionLoading } = useAuth();
  const sessionStatus = sessionLoading ? "loading" : session ? "authenticated" : "unauthenticated";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entity, setEntity] = useState<EntityWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EntityWithRelations[]>([]);
  const [showEntitySearch, setShowEntitySearch] = useState(!entityId);
  
  const [formData, setFormData] = useState({
    entityId: entityId || "",
    message: "",
  });

  // Load entity if entityId is in URL
  useEffect(() => {
    if (entityId) {
      fetch(`/api/entities/${entityId}`)
        .then((res) => res.json())
        .then((data: ApiResponse<EntityWithRelations>) => {
          if (data.success && data.data) {
            setEntity(data.data);
            setFormData((prev) => ({ ...prev, entityId: entityId }));
          }
        })
        .catch(console.error);
    }
  }, [entityId]);

  // Search entities
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetch(`/api/entities?q=${encodeURIComponent(searchQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data: ApiResponse<EntityWithRelations[]>) => {
          if (data.success && data.data) {
            setSearchResults(data.data);
          }
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectEntity = (selectedEntity: EntityWithRelations) => {
    setEntity(selectedEntity);
    setFormData((prev) => ({ ...prev, entityId: selectedEntity.id }));
    setShowEntitySearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.entityId) {
      setError(t("selectEntityError"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/entities/${formData.entityId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formData.message }),
      });

      const data: ApiResponse = await response.json();

      if (data.code === "already_member") throw new Error(t("alreadyMember"));
      if (data.code === "claim_pending") throw new Error(t("claimPending"));
      if (!response.ok || !data.success) {
        throw new Error(data.error || t("failedToSubmit"));
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSubmit"));
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
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t("submitted")}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {t("submittedBody", { entityName: entity?.name ?? "" })}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/")}>
            {t("backToDirectory")}
          </Button>
          <Button variant="outline" onClick={() => router.push("/portal/dashboard")}>
            {t("goToPortal")}
          </Button>
        </div>
      </Card>
    );
  }

  // Claims are tied to an account: send visitors to sign in (or register)
  // and bring them straight back here afterwards.
  if (sessionStatus === "unauthenticated") {
    const callbackUrl = encodeURIComponent(entityId ? `/claim?entityId=${entityId}` : "/claim");
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("signInTitle")}</h1>
        {entity && <p className="text-lg font-medium text-gray-800 mb-2">{entity.name}</p>}
        <p className="text-gray-600 mb-6">{t("signInBody")}</p>
        <div className="flex gap-4 justify-center">
          <Button href={`/auth/signin?callbackUrl=${callbackUrl}`}>{t("signIn")}</Button>
          <Button variant="outline" href={`/auth/signup?callbackUrl=${callbackUrl}`}>
            {t("createAccount")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600">
          {t("subtitle")}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Entity Selection */}
          {showEntitySearch ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("findEntity")}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectEntity(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {result.address && (
                          <div className="text-sm text-gray-500">{result.address}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : entity ? (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{entity.name}</div>
                  {entity.address && (
                    <div className="text-sm text-gray-600">{entity.address}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEntitySearch(true);
                    setEntity(null);
                    setFormData((prev) => ({ ...prev, entityId: "" }));
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {t("change")}
                </button>
              </div>
            </div>
          ) : null}

          {/* Why they should get the listing */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            {session?.user?.email && (
              <p className="text-sm text-gray-500">{t("signedInAs", { email: session.user.email })}</p>
            )}
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              {t("messageLabel")}
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={2000}
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              placeholder={t("messagePlaceholder")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>{t("note")}</strong> {t("noteText")}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.entityId || sessionStatus !== "authenticated"}
              className="flex-1"
            >
              {loading ? t("submitting") : t("submitClaimRequest")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

export default function ClaimEntityPage() {
  const tCommon = useTranslations("common");
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense fallback={
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{tCommon("loading")}</p>
          </Card>
        }>
          <ClaimEntityContent />
        </Suspense>
      </main>
    </div>
  );
}
