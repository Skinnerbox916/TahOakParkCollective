/**
 * Who manages a listing. Owners join through a share link (share-links.ts);
 * admins can also add and remove members directly.
 */
import { prisma } from "@/lib/prisma";
import type { Actor } from "./access";
import { EntityServiceError, ForbiddenError, NotFoundError } from "./errors";
import { isAdminActor } from "./fields";

export async function listMembers(entityId: string) {
  return prisma.entityMember.findMany({
    where: { entityId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

function assertAdmin(actor: Actor) {
  if (!isAdminActor(actor.roles)) throw new ForbiddenError("Only admins can change a listing's members");
}

/** Admin: add (or change the role of) a member by email. */
export async function addMember(actor: Actor, entityId: string, email: string, role: "OWNER" | "MANAGER" = "OWNER") {
  assertAdmin(actor);
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true } });
  if (!entity) throw new NotFoundError();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) {
    throw new EntityServiceError("No account uses that email. They need to register first.", 404, "user_not_found");
  }
  return prisma.entityMember.upsert({
    where: { entityId_userId: { entityId, userId: user.id } },
    create: { entityId, userId: user.id, role, addedBy: actor.id },
    update: { role },
  });
}

/** Admin: remove a member. */
export async function removeMember(actor: Actor, entityId: string, userId: string) {
  assertAdmin(actor);
  const { count } = await prisma.entityMember.deleteMany({ where: { entityId, userId } });
  if (count === 0) throw new NotFoundError("Member");
}
