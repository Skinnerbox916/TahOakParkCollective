import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Role } from "@/lib/prismaEnums";
import { ROLE } from "@/lib/prismaEnums";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function isAdmin() {
  try {
    const user = await requireRole([ROLE.ADMIN]);
    return !!user;
  } catch {
    return false;
  }
}

export async function isBusinessOwner() {
  try {
    const user = await requireRole([ROLE.BUSINESS_OWNER, ROLE.ADMIN]);
    return !!user;
  } catch {
    return false;
  }
}

export async function hasRole(role: Role) {
  try {
    const user = await requireAuth();
    return user.role === role || user.role === ROLE.ADMIN;
  } catch {
    return false;
  }
}

