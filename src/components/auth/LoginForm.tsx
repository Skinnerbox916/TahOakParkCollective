"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { appName } from "@/lib/site";
import { CodeField, Divider, Notice, authErrorKey, passkeysSupported, useCallbackUrl } from "./shared";

type Step = "password" | "code-email" | "code-enter" | "verify-email" | "two-factor";

/**
 * Sign in with a passkey (button or browser autofill), email + password, or an
 * emailed code. Handles the authenticator-code step and unconfirmed emails.
 */
export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const callbackUrl = useCallbackUrl("/portal/dashboard");
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    searchParams.get("registered") === "true" ? t("accountCreated") : searchParams.get("reset") === "true" ? t("passwordReset") : null
  );
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
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

  // Offer saved passkeys in the email field's autofill (conditional UI).
  useEffect(() => {
    let active = true;
    (async () => {
      if (!passkeysSupported()) return;
      const available = await window.PublicKeyCredential.isConditionalMediationAvailable?.().catch(() => false);
      if (!available) return;
      const result = await authClient.signIn.passkey({ autoFill: true }).catch(() => null);
      if (active && result && !result.error) finish();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPasskey = () =>
    run(async () => {
      const result = await authClient.signIn.passkey();
      if (result?.error) setError(t("passkeyFailed"));
      else finish();
    });

  const signInWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          // A fresh code was emailed on this attempt
          setCode("");
          setNotice(t("codeSentTo", { email }));
          setStep("verify-email");
        } else {
          setError(t(authErrorKey(result.error)));
        }
        return;
      }
      if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
        setCode("");
        setStep("two-factor");
        return;
      }
      finish();
    });
  };

  const sendSignInCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (result.error) return setError(t(authErrorKey(result.error)));
      setCode("");
      setNotice(t("codeSentTo", { email }));
      setStep("code-enter");
    });
  };

  const signInWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.signIn.emailOtp({ email, otp: code });
      if (result.error) return setError(t(authErrorKey(result.error)));
      finish();
    });
  };

  const confirmEmail = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await authClient.emailOtp.verifyEmail({ email, otp: code });
      if (result.error) return setError(t(authErrorKey(result.error)));
      // Confirmed: sign in with the password they already entered
      const signIn = await authClient.signIn.email({ email, password });
      if (signIn.data && "twoFactorRedirect" in signIn.data && signIn.data.twoFactorRedirect) {
        setCode("");
        return setStep("two-factor");
      }
      if (signIn.error) return setError(t(authErrorKey(signIn.error)));
      finish();
    });
  };

  const resend = (type: "sign-in" | "email-verification") =>
    run(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type });
      if (result.error) return setError(t(authErrorKey(result.error)));
      setNotice(t("codeResent"));
    });

  const verifySecondFactor = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code });
      if (result.error) return setError(t(authErrorKey(result.error)));
      finish();
    });
  };

  const messages = (
    <>
      {notice && <Notice kind="success">{notice}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
    </>
  );

  if (step === "two-factor") {
    return (
      <form onSubmit={verifySecondFactor} className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t("twoFactorTitle")}</h2>
        {!useBackup && <p className="text-sm text-gray-600">{t("twoFactorHint", { app: appName() })}</p>}
        {messages}
        <CodeField
          label={useBackup ? t("backupCode") : t("code")}
          value={code}
          onChange={setCode}
          disabled={busy}
          long={useBackup}
        />
        <Button type="submit" className="w-full" disabled={busy || !code}>
          {busy ? t("verifying") : t("verify")}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary-600 hover:text-primary-700"
          onClick={() => {
            setUseBackup(!useBackup);
            setCode("");
            setError(null);
          }}
        >
          {useBackup ? t("useAuthenticatorCode") : t("useBackupCode")}
        </button>
      </form>
    );
  }

  if (step === "verify-email" || step === "code-enter") {
    const verifying = step === "verify-email";
    return (
      <form onSubmit={verifying ? confirmEmail : signInWithCode} className="space-y-4">
        {verifying && <h2 className="text-lg font-semibold text-gray-900">{t("verifyEmailTitle")}</h2>}
        {messages}
        <CodeField label={t("code")} value={code} onChange={setCode} disabled={busy} />
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? t("verifying") : verifying ? t("verify") : t("signIn")}
        </Button>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            className="text-primary-600 hover:text-primary-700"
            onClick={() => resend(verifying ? "email-verification" : "sign-in")}
            disabled={busy}
          >
            {t("resendCode")}
          </button>
          <button
            type="button"
            className="text-gray-600 hover:text-gray-800"
            onClick={() => {
              setStep("password");
              setNotice(null);
              setError(null);
            }}
          >
            {t("back")}
          </button>
        </div>
      </form>
    );
  }

  if (step === "code-email") {
    return (
      <form onSubmit={sendSignInCode} className="space-y-4">
        {messages}
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
        <button
          type="button"
          className="w-full text-sm text-primary-600 hover:text-primary-700"
          onClick={() => {
            setStep("password");
            setError(null);
          }}
        >
          {t("usePasswordInstead")}
        </button>
      </form>
    );
  }

  return (
    <div>
      {passkeysSupported() && (
        <>
          <Button type="button" variant="outline" className="w-full" onClick={signInWithPasskey} disabled={busy}>
            🔑 {t("signInWithPasskey")}
          </Button>
          <Divider />
        </>
      )}

      <form onSubmit={signInWithPassword} className="space-y-4">
        {messages}
        <Input
          type="email"
          name="email"
          label={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // "webauthn" lets the browser offer saved passkeys here too
          autoComplete="username webauthn"
          required
          disabled={busy}
        />
        <Input
          type="password"
          name="password"
          label={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={busy}
        />
        <div className="text-right -mt-2">
          <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
            {t("forgotPassword")}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("signingIn") : t("signIn")}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 w-full text-sm text-primary-600 hover:text-primary-700"
        onClick={() => {
          setStep("code-email");
          setError(null);
          setNotice(null);
        }}
      >
        {t("emailMeACode")}
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t("dontHaveAccount")}{" "}
        <Link
          href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
