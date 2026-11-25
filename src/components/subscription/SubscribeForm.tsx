"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Honeypot, honeypotValue } from "@/components/ui/Honeypot";

interface SubscribeFormProps {
  onSuccess?: () => void;
}

export function SubscribeForm({ onSuccess }: SubscribeFormProps) {
  const t = useTranslations("subscribe");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const homepage = honeypotValue(e.currentTarget);
    setError(null);
    setLoading(true);

    try {
      // The language decides which language the confirmation email is in.
      const response = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, homepage }),
      });
      if (!response.ok) {
        throw new Error(response.status === 429 ? t("tooMany") : t("failed"));
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("checkEmailTitle")}</h2>
        <p className="text-gray-600 mb-4">{t.rich("sentTo", { email, strong: (chunks) => <strong>{chunks}</strong> })}</p>
        <p className="text-sm text-gray-500">{t("linkExpires")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <Honeypot />
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">{error}</div>
        )}

        <Input
          type="email"
          label={t("emailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="you@example.com"
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("subscribing") : t("subscribeButton")}
        </Button>

        <p className="text-xs text-gray-500 text-center">{t("consent")}</p>
      </form>
    </Card>
  );
}
