"use client";

import { useRouter } from "@/i18n/routing";
import { authClient, sessionAdminState } from "@/lib/auth-client";

/**
 * Session state for client components. `isAdmin` is true only for a strong
 * session (passkey or authenticator code), matching the server rule;
 * `needsStepUp` means an admin who has to verify before using admin tools.
 */
export function useAuth() {
  const { data, isPending, refetch } = authClient.useSession();
  const router = useRouter();
  const { isAdmin, needsStepUp } = sessionAdminState(data);

  return {
    session: data,
    user: data?.user ?? null,
    loading: isPending,
    isAdmin,
    needsStepUp,
    refetch,
    signOut: async () => {
      await authClient.signOut();
      router.push("/"); // the i18n router keeps the current language
      router.refresh();
    },
  };
}
