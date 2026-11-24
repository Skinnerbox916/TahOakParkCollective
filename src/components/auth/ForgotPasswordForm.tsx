"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { CodeField, Notice, authErrorKey } from "./shared";

/** Reset a forgotten password with an emailed code. Signs out every device. */
export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch {
      setError(t("errorOccurred"));
    } finally {
      setBusy(false);
    }
  };

  const requestCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.emailOtp.requestPasswordReset({ email });
      if (result.error) return setError(t(authErrorKey(result.error)));
      setNotice(t("codeSentTo", { email }));
      setStep("reset");
    });
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.emailOtp.resetPassword({ email, otp: code, password });
      if (result.error) return setError(t(authErrorKey(result.error)));
      router.push("/auth/signin?reset=true");
    });
  };

  if (step === "reset") {
    return (
      <form onSubmit={reset} className="space-y-4">
        {notice && <Notice kind="success">{notice}</Notice>}
        {error && <Notice kind="error">{error}</Notice>}
        <CodeField label={t("code")} value={code} onChange={setCode} disabled={busy} />
        <div>
          <Input
            type="password"
            label={t("newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={busy}
          />
          <p className="mt-1 text-xs text-gray-500">{t("passwordHint")}</p>
        </div>
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {t("resetPassword")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <p className="text-sm text-gray-600">{t("forgotIntro")}</p>
      {error && <Notice kind="error">{error}</Notice>}
      <Input
        type="email"
        label={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        required
        disabled={busy}
        autoFocus
      />
      <Button type="submit" className="w-full" disabled={busy || !email}>
        {busy ? t("sendingCode") : t("sendCode")}
      </Button>
      <p className="text-center text-sm">
        <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700">
          {t("back")}
        </Link>
      </p>
    </form>
  );
}
