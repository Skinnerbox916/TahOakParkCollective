"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { Notice, passkeysSupported, useCallbackUrl } from "./shared";

/**
 * An admin whose session came from a password or emailed code verifies with a
 * passkey (which starts a strong session), or signs in again with password +
 * authenticator code.
 */
export function StepUp() {
  const t = useTranslations("auth");
  const router = useRouter();
  const callbackUrl = useCallbackUrl("/admin/dashboard");
  const { data: session } = authClient.useSession();
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient.passkey
      .listUserPasskeys()
      .then((result) => setHasPasskey((result.data?.length ?? 0) > 0))
      .catch(() => setHasPasskey(false));
  }, []);

  const twoFactorEnabled = session?.user.twoFactorEnabled === true;

  const verifyWithPasskey = async () => {
    setBusy(true);
    setError(null);
    const result = await authClient.signIn.passkey().catch(() => null);
    setBusy(false);
    if (!result || result.error) return setError(t("passkeyFailed"));
    router.push(callbackUrl);
    router.refresh();
  };

  const signInAgain = async () => {
    setBusy(true);
    await authClient.signOut();
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  if (hasPasskey === null) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t("stepUpBody")}</p>
      {error && <Notice kind="error">{error}</Notice>}
      {hasPasskey && passkeysSupported() && (
        <Button type="button" className="w-full" onClick={verifyWithPasskey} disabled={busy}>
          🔑 {t("stepUpWithPasskey")}
        </Button>
      )}
      {twoFactorEnabled && (
        <Button type="button" variant="outline" className="w-full" onClick={signInAgain} disabled={busy}>
          {t("stepUpWithPassword")}
        </Button>
      )}
      {!hasPasskey && !twoFactorEnabled && (
        <>
          <Notice kind="info">{t("stepUpSetup")}</Notice>
          <Button href="/portal/account#security" className="w-full">
            {t("goToAccountSecurity")}
          </Button>
        </>
      )}
    </div>
  );
}
