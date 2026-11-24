/**
 * Better Auth's browser client. Use `authClient.useSession()` in client
 * components; server code uses src/lib/auth.ts.
 */
import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
  twoFactorClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import type { auth } from "@/lib/better-auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient(), passkeyClient(), twoFactorClient(), adminClient()],
});

/** Mirrors src/lib/auth.ts: admin powers need a strong session. */
export function sessionAdminState(session: { user: { role?: string | null }; session: { strongAuth?: boolean | null } } | null | undefined) {
  const isAdminRole = (session?.user.role ?? "").split(",").map((r) => r.trim()).includes("admin");
  const strong = session?.session.strongAuth === true;
  return { isAdmin: isAdminRole && strong, needsStepUp: isAdminRole && !strong };
}
