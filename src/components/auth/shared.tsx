"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { safeCallbackPath } from "@/lib/safe-redirect";

type AuthError = { code?: string; status?: number; message?: string } | null | undefined;

/** Map a Better Auth error to a key in the "auth" messages. */
export function authErrorKey(error: AuthError): string {
  if (!error) return "errorOccurred";
  if (error.status === 429) return "tooManyAttempts";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "invalidCredentials";
    case "EMAIL_NOT_VERIFIED":
      return "verifyEmailNeeded";
    case "PASSWORD_COMPROMISED":
      return "passwordCompromised";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    case "INVALID_OTP":
    case "OTP_EXPIRED":
    case "INVALID_CODE":
    case "OTP_HAS_EXPIRED":
    case "INVALID_BACKUP_CODE":
      return "invalidCode";
    case "TOO_MANY_ATTEMPTS":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "tooManyAttempts";
    case "USER_NOT_FOUND":
      return "noAccountForCode";
    default:
      return "errorOccurred";
  }
}

/** Where to go after signing in: a local callbackUrl, or `fallback`. */
export function useCallbackUrl(fallback = "/portal/dashboard"): string {
  return safeCallbackPath(useSearchParams().get("callbackUrl")) ?? fallback;
}

/** A 6-digit code box that phones can fill from the SMS/email suggestion bar. */
export function CodeField({
  value,
  onChange,
  disabled,
  label,
  long = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  /** Backup codes are longer and contain letters. */
  long?: boolean;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChange={(e) => onChange(long ? e.target.value.trim() : e.target.value.replace(/\D/g, "").slice(0, 6))}
      inputMode={long ? "text" : "numeric"}
      autoComplete="one-time-code"
      pattern={long ? undefined : "[0-9]{6}"}
      maxLength={long ? 32 : 6}
      required
      disabled={disabled}
      autoFocus
      className={long ? "" : "tracking-[0.4em] text-lg"}
    />
  );
}

export function Notice({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-error-50 border-error-200 text-error-700",
    success: "bg-success-50 border-success-200 text-success-700",
    info: "bg-primary-50 border-primary-200 text-primary-800",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`p-3 border rounded-lg text-sm ${styles}`}>
      {children}
    </div>
  );
}

/** The card every auth page sits in. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Divider() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3 my-5 text-sm text-gray-400">
      <span className="h-px flex-1 bg-gray-200" />
      {t("or")}
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

/** WebAuthn is available in this browser. */
export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
}
