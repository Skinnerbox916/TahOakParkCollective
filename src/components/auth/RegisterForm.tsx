"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { AddPasskeyPrompt } from "./AddPasskeyPrompt";
import { CodeField, Notice, authErrorKey, passkeysSupported, useCallbackUrl } from "./shared";

type Step = "details" | "verify" | "passkey";

/** Create an account: details, then the emailed code, then an optional passkey. */
export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const callbackUrl = useCallbackUrl("/portal/dashboard");

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const finish = () => {
    router.push(callbackUrl);
    router.refresh();
  };

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

  const createAccount = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.signUp.email({ name: name.trim(), email, password, locale });
      if (result.error) return setError(t(authErrorKey(result.error)));
      // A confirmation code is on its way (emails are confirmed before first sign-in)
      setNotice(t("codeSentTo", { email }));
      setStep("verify");
    });
  };

  const confirmEmail = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.emailOtp.verifyEmail({ email, otp: code });
      if (result.error) return setError(t(authErrorKey(result.error)));
      // Confirming signs them in; make sure the session exists before continuing
      let session = await authClient.getSession();
      if (!session.data) {
        await authClient.signIn.email({ email, password });
        session = await authClient.getSession();
      }
      if (passkeysSupported()) setStep("passkey");
      else finish();
    });
  };

  const resend = () =>
    run(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (result.error) return setError(t(authErrorKey(result.error)));
      setNotice(t("codeResent"));
    });

  if (step === "passkey") {
    return <AddPasskeyPrompt onDone={finish} />;
  }

  if (step === "verify") {
    return (
      <form onSubmit={confirmEmail} className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t("verifyEmailTitle")}</h2>
        {notice && <Notice kind="success">{notice}</Notice>}
        {error && <Notice kind="error">{error}</Notice>}
        <CodeField label={t("code")} value={code} onChange={setCode} disabled={busy} />
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? t("verifying") : t("verify")}
        </Button>
        <button type="button" className="w-full text-sm text-primary-600 hover:text-primary-700" onClick={resend} disabled={busy}>
          {t("resendCode")}
        </button>
        <p className="text-xs text-gray-500">{t("existingAccountHint")}</p>
      </form>
    );
  }

  return (
    <form onSubmit={createAccount} className="space-y-4">
      {error && <Notice kind="error">{error}</Notice>}
      <Input
        type="text"
        name="name"
        label={t("name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        required
        disabled={busy}
      />
      <Input
        type="email"
        name="email"
        label={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        disabled={busy}
      />
      <div>
        <Input
          type="password"
          name="password"
          label={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // Lets password managers offer a strong generated password
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          disabled={busy}
        />
        <p className="mt-1 text-xs text-gray-500">{t("passwordHint")}</p>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("creatingAccount") : t("createAccount")}
      </Button>
      <p className="text-center text-sm text-gray-600">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
