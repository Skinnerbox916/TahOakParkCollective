import type { Role } from "@/lib/prismaEnums";
import { isAdminActor } from "./fields";

/** Whoever is making a change. Public submitters have no id. */
export interface Actor {
  id: string | null;
  roles: Role[];
  email?: string | null;
}

/** Admins manage every listing; owners manage their own. */
export function canManage(actor: Actor, entity: { ownerId: string }): boolean {
  if (isAdminActor(actor.roles)) return true;
  return !!actor.id && entity.ownerId === actor.id;
}
