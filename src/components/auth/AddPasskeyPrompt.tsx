"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { Notice } from "./shared";

/** "Sign in faster next time": offered right after sign-up. Skippable. */
export function AddPasskeyPrompt({ onDone }: { onDone: () => void }) {
  const t = useTranslations("auth");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true);
    setError(null);
    const result = await authClient.passkey.addPasskey().catch(() => null);
    setBusy(false);
    if (!result || result.error) {
      setError(t("passkeyFailed"));
      return;
    }
    onDone();
  };

  return (
    <div className="space-y-4 text-center">
      <div className="text-5xl" aria-hidden>
        🔑
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{t("addPasskeyTitle")}</h2>
      <p className="text-sm text-gray-600">{t("addPasskeyBody")}</p>
      {error && <Notice kind="error">{error}</Notice>}
      <Button type="button" className="w-full" onClick={add} disabled={busy}>
        {t("addPasskey")}
      </Button>
      <button type="button" className="w-full text-sm text-gray-600 hover:text-gray-800" onClick={onDone} disabled={busy}>
        {t("notNow")}
      </button>
    </div>
  );
}
