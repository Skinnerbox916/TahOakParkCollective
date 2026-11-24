import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/prismaEnums";
import type { Tx } from "./apply";
import { isAdminActor } from "./fields";

/** Whoever is making a change. Public submitters have no id. */
export interface Actor {
  id: string | null;
  roles: Role[];
  email?: string | null;
}

/** Admins manage every listing; members (owners and managers) manage theirs. */
export async function canManage(actor: Actor, entityId: string, db: Tx = prisma): Promise<boolean> {
  if (isAdminActor(actor.roles)) return true;
  if (!actor.id) return false;
  const membership = await db.entityMember.findUnique({
    where: { entityId_userId: { entityId, userId: actor.id } },
    select: { id: true },
  });
  return !!membership;
}

/** The user's role on this listing, or null. Unlike canManage, admins get no pass. */
export async function memberRole(userId: string | null, entityId: string, db: Tx = prisma) {
  if (!userId) return null;
  const membership = await db.entityMember.findUnique({
    where: { entityId_userId: { entityId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

/** Whether the user manages at least one listing. */
export async function managesAnyEntity(userId: string): Promise<boolean> {
  const membership = await prisma.entityMember.findFirst({ where: { userId }, select: { id: true } });
  return !!membership;
}
