"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CodeField, Notice, authErrorKey, passkeysSupported } from "@/components/auth/shared";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/use-auth";
import { Link, useRouter } from "@/i18n/routing";

type Status = { kind: "error" | "success"; text: string } | null;

function useStatus() {
  const [status, setStatus] = useState<Status>(null);
  return { status, setStatus, view: status && <Notice kind={status.kind}>{status.text}</Notice> };
}

function Section({ id, title, intro, children }: { id?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="p-5 sm:p-6 scroll-mt-20">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {intro && <p className="mt-1 text-sm text-gray-600">{intro}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </Card>
  );
}

/** Everything a signed-in person manages about their sign-in. */
export function AccountSettings() {
  const t = useTranslations("account");
  const { session, needsStepUp, refetch } = useAuth();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [passkeyCount, setPasskeyCount] = useState<number | null>(null);

  const loadAccounts = useCallback(async () => {
    const accounts = await authClient.listAccounts();
    setHasPassword((accounts.data ?? []).some((a) => a.providerId === "credential"));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  if (!session) return null;
  const user = session.user;
  const isAdminRole = (user.role ?? "").split(",").includes("admin");
  const adminNeedsSetup = isAdminRole && passkeyCount === 0 && !user.twoFactorEnabled;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
      {adminNeedsSetup && <Notice kind="info">{t("adminSetupRequired")}</Notice>}
      {needsStepUp && !adminNeedsSetup && passkeyCount !== null && (
        <Notice kind="info">
          {t("adminVerifyNow")}{" "}
          <Link href="/auth/step-up?callbackUrl=%2Fadmin%2Fdashboard" className="font-medium underline">
            →
          </Link>
        </Notice>
      )}
      <ProfileSection name={user.name} locale={(user as { locale?: string }).locale ?? "en"} onSaved={refetch} />
      <EmailSection email={user.email} onChanged={refetch} />
      <div id="security" className="space-y-6 scroll-mt-20">
        <PasskeysSection onCount={setPasskeyCount} />
        <PasswordSection hasPassword={hasPassword} onChanged={loadAccounts} />
        <TwoFactorSection enabled={user.twoFactorEnabled === true} hasPassword={hasPassword} onChanged={refetch} />
      </div>
      <SessionsSection currentToken={session.session.token} />
    </div>
  );
}

function ProfileSection({ name, locale, onSaved }: { name: string; locale: string; onSaved: () => void }) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const [value, setValue] = useState(name);
  const [lang, setLang] = useState(locale);
  const [busy, setBusy] = useState(false);
  const { setStatus, view } = useStatus();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await authClient.updateUser({ name: value.trim(), locale: lang });
    setBusy(false);
    setStatus(result.error ? { kind: "error", text: t("error") } : { kind: "success", text: t("saved") });
    if (!result.error) onSaved();
  };

  return (
    <Section title={t("profile")}>
      <form onSubmit={save} className="space-y-3">
        {view}
        <Input label={tAuth("name")} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="name" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("language")}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          {t("save")}
        </Button>
      </form>
    </Section>
  );
}

function EmailSection({ email, onChanged }: { email: string; onChanged: () => void }) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const [step, setStep] = useState<"view" | "new" | "code">("view");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { setStatus, view } = useStatus();

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await authClient.emailOtp.requestEmailChange({ newEmail });
    setBusy(false);
    if (result.error) return setStatus({ kind: "error", text: tAuth(authErrorKey(result.error)) });
    setStatus({ kind: "success", text: tAuth("codeSentTo", { email: newEmail }) });
    setStep("code");
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await authClient.emailOtp.changeEmail({ newEmail, otp: code });
    setBusy(false);
    if (result.error) return setStatus({ kind: "error", text: tAuth(authErrorKey(result.error)) });
    setStatus({ kind: "success", text: t("emailChanged") });
    setStep("view");
    setCode("");
    onChanged();
  };

  return (
    <Section title={t("emailSection")}>
      {view}
      {step === "view" && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-900 break-all">{email}</span>
          <Button variant="outline" size="sm" onClick={() => setStep("new")}>
            {t("changeEmail")}
          </Button>
        </div>
      )}
      {step === "new" && (
        <form onSubmit={request} className="space-y-3">
          <Input type="email" label={t("newEmail")} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" required />
          <Button type="submit" disabled={busy}>
            {tAuth("sendCode")}
          </Button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={confirm} className="space-y-3">
          <CodeField label={tAuth("code")} value={code} onChange={setCode} disabled={busy} />
          <Button type="submit" disabled={busy || code.length !== 6}>
            {tAuth("verify")}
          </Button>
        </form>
      )}
    </Section>
  );
}

function PasswordSection({ hasPassword, onChanged }: { hasPassword: boolean | null; onChanged: () => void }) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const { setStatus, view } = useStatus();

  if (hasPassword === null) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let errorCode: { code?: string; status?: number } | null = null;
    if (hasPassword) {
      const result = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
      errorCode = result.error ?? null;
    } else {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) errorCode = { code: data.code, status: res.status };
    }
    setBusy(false);
    if (errorCode) return setStatus({ kind: "error", text: tAuth(authErrorKey(errorCode)) });
    setStatus({ kind: "success", text: t("passwordChanged") });
    setCurrent("");
    setNext("");
    onChanged();
  };

  return (
    <Section title={t("passwordSection")} intro={hasPassword ? undefined : t("noPasswordYet")}>
      <form onSubmit={submit} className="space-y-3">
        {view}
        {/* Hidden username helps password managers save the right entry */}
        <input type="email" autoComplete="username" className="hidden" readOnly value="" />
        {hasPassword && (
          <Input
            type="password"
            label={t("currentPassword")}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        )}
        <Input
          type="password"
          label={tAuth("newPassword")}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <p className="text-xs text-gray-500">{tAuth("passwordHint")}</p>
        <Button type="submit" disabled={busy}>
          {hasPassword ? t("changePassword") : t("setPassword")}
        </Button>
      </form>
    </Section>
  );
}

interface PasskeyRow {
  id: string;
  name?: string | null;
  createdAt?: Date | string | null;
}

function PasskeysSection({ onCount }: { onCount: (count: number) => void }) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const format = useFormatter();
  const [passkeys, setPasskeys] = useState<PasskeyRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { setStatus, view } = useStatus();

  const load = useCallback(async () => {
    const result = await authClient.passkey.listUserPasskeys();
    const rows = (result.data ?? []) as PasskeyRow[];
    setPasskeys(rows);
    onCount(rows.length);
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    const result = await authClient.passkey.addPasskey().catch(() => null);
    setBusy(false);
    if (!result || result.error) return setStatus({ kind: "error", text: tAuth("passkeyFailed") });
    setStatus({ kind: "success", text: tAuth("passkeyAdded") });
    load();
  };

  const rename = async (passkey: PasskeyRow) => {
    const name = window.prompt(t("passkeyName"), passkey.name ?? "");
    if (!name?.trim()) return;
    await authClient.passkey.updatePasskey({ id: passkey.id, name: name.trim() });
    load();
  };

  const remove = async (passkey: PasskeyRow) => {
    if (!window.confirm(t("removePasskeyConfirm", { name: passkey.name || t("unnamedPasskey") }))) return;
    await authClient.passkey.deletePasskey({ id: passkey.id });
    load();
  };

  return (
    <Section title={t("passkeysSection")} intro={t("passkeysIntro")}>
      {view}
      {passkeys?.length === 0 && <p className="text-sm text-gray-500">{t("noPasskeys")}</p>}
      <ul className="divide-y divide-gray-100">
        {passkeys?.map((passkey) => (
          <li key={passkey.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              <span className="text-gray-900">🔑 {passkey.name || t("unnamedPasskey")}</span>
              {passkey.createdAt && (
                <span className="block text-xs text-gray-500">
                  {t("addedOn", { date: format.dateTime(new Date(passkey.createdAt), { dateStyle: "medium" }) })}
                </span>
              )}
            </span>
            <span className="flex gap-3 shrink-0">
              <button type="button" className="text-primary-600 hover:text-primary-800" onClick={() => rename(passkey)}>
                {t("rename")}
              </button>
              <button type="button" className="text-error-600 hover:text-error-800" onClick={() => remove(passkey)}>
                {t("remove")}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {passkeysSupported() && (
        <Button type="button" onClick={add} disabled={busy}>
          {t("addPasskey")}
        </Button>
      )}
    </Section>
  );
}

function TwoFactorSection({ enabled, hasPassword, onChanged }: { enabled: boolean; hasPassword: boolean | null; onChanged: () => void }) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const [step, setStep] = useState<"idle" | "password" | "scan" | "backup">("idle");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { setStatus, view } = useStatus();

  const secret = totpURI ? new URL(totpURI).searchParams.get("secret") ?? "" : "";

  const confirmPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (enabled) {
      const result = await authClient.twoFactor.disable({ password });
      setBusy(false);
      if (result.error) return setStatus({ kind: "error", text: tAuth(authErrorKey(result.error)) });
      setStep("idle");
      setPassword("");
      onChanged();
      return;
    }
    const result = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (result.error || !result.data || !("totpURI" in result.data)) {
      return setStatus({ kind: "error", text: tAuth(authErrorKey(result.error)) });
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    setPassword("");
    setStep("scan");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (result.error) return setStatus({ kind: "error", text: tAuth(authErrorKey(result.error)) });
    setStatus(null);
    setStep("backup");
  };

  return (
    <Section title={t("twoFactorSection")} intro={t("twoFactorIntro")}>
      {view}
      {step === "idle" && (
        <div className="flex items-center justify-between gap-3">
          <span className={enabled ? "text-success-700 font-medium" : "text-gray-500"}>
            {enabled ? t("twoFactorOn") : t("twoFactorOff")}
          </span>
          {hasPassword ? (
            <Button variant="outline" size="sm" onClick={() => setStep("password")}>
              {enabled ? t("disableTwoFactor") : t("enableTwoFactor")}
            </Button>
          ) : (
            hasPassword === false && <span className="text-xs text-gray-500 text-right">{t("twoFactorNeedsPassword")}</span>
          )}
        </div>
      )}
      {step === "password" && (
        <form onSubmit={confirmPassword} className="space-y-3">
          <Input
            type="password"
            label={t("confirmWithPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" disabled={busy}>
            {tAuth("continue")}
          </Button>
        </form>
      )}
      {step === "scan" && (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm text-gray-600">{t("scanQr")}</p>
          <div className="bg-white p-3 inline-block border border-gray-200 rounded">
            <QRCode value={totpURI} size={176} />
          </div>
          <p className="text-xs text-gray-500 break-all">{t("manualKey", { key: secret })}</p>
          <CodeField label={tAuth("code")} value={code} onChange={setCode} disabled={busy} />
          <Button type="submit" disabled={busy || code.length !== 6}>
            {tAuth("verify")}
          </Button>
        </form>
      )}
      {step === "backup" && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">{t("backupCodesTitle")}</h3>
          <p className="text-sm text-gray-600">{t("backupCodesBody")}</p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 p-3 rounded">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button
            onClick={() => {
              setStep("idle");
              setBackupCodes([]);
              setCode("");
              onChanged();
            }}
          >
            {t("done")}
          </Button>
        </div>
      )}
    </Section>
  );
}

interface SessionRow {
  id: string;
  token: string;
  userAgent?: string | null;
  createdAt: Date | string;
}

function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(userAgent) ? "iOS" : /Android/.test(userAgent) ? "Android" : /Mac OS X/.test(userAgent) ? "macOS" : /Windows/.test(userAgent) ? "Windows" : /Linux/.test(userAgent) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

function SessionsSection({ currentToken }: { currentToken: string }) {
  const t = useTranslations("account");
  const format = useFormatter();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const load = useCallback(async () => {
    const result = await authClient.listSessions();
    setSessions((result.data ?? []) as SessionRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (token: string) => {
    await authClient.revokeSession({ token });
    if (token === currentToken) {
      router.push("/");
      router.refresh();
    } else load();
  };

  return (
    <Section title={t("sessionsSection")}>
      <ul className="divide-y divide-gray-100">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              <span className="text-gray-900">{describeDevice(s.userAgent)}</span>
              {s.token === currentToken && <span className="ml-2 text-xs text-success-700">{t("thisDevice")}</span>}
              <span className="block text-xs text-gray-500">
                {t("lastActive", { date: format.dateTime(new Date(s.createdAt), { dateStyle: "medium", timeStyle: "short" }) })}
              </span>
            </span>
            <button type="button" className="text-error-600 hover:text-error-800 shrink-0" onClick={() => revoke(s.token)}>
              {t("signOutDevice")}
            </button>
          </li>
        ))}
      </ul>
      {sessions.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await authClient.revokeOtherSessions();
            load();
          }}
        >
          {t("signOutOthers")}
        </Button>
      )}
    </Section>
  );
}
