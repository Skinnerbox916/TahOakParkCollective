/**
 * Server-side session helpers. Every page, layout and API route gets the
 * signed-in user from here.
 *
 * The admin rule lives in toSessionUser: someone with the admin role only gets
 * ADMIN in `roles` when this session signed in with a passkey or an
 * authenticator code (`strongAuth`). A weaker session (password only, emailed
 * code) is treated as a normal member everywhere and is flagged
 * `adminNeedsStepUp` so the UI can offer to verify.
 */
import { headers } from "next/headers";
import { auth, type AuthSession } from "@/lib/better-auth";
import { ROLE, type Role } from "@/lib/prismaEnums";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  locale: string;
  roles: Role[];
  /** Has the admin role but this session can't use it yet. */
  adminNeedsStepUp: boolean;
  /** This session signed in with a passkey or an authenticator code. */
  strongAuth: boolean;
}

export function hasAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").split(",").map((r) => r.trim()).includes("admin");
}

export function toSessionUser(session: AuthSession): SessionUser {
  const strongAuth = session.session.strongAuth === true;
  const admin = hasAdminRole(session.user.role);
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    locale: (session.user as { locale?: string }).locale ?? "en",
    roles: admin && strongAuth ? [ROLE.USER, ROLE.ADMIN] : [ROLE.USER],
    adminNeedsStepUp: admin && !strongAuth,
    strongAuth,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session ? toSessionUser(session) : null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.roles.some((role) => allowedRoles.includes(role))) throw new Error("Forbidden");
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles.includes(ROLE.ADMIN) ?? false;
}
