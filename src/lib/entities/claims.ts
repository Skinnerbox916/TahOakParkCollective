/**
 * Claims and members. A signed-in user claims a listing; an admin approves
 * the CLAIM_ENTITY approval (approvals.ts), which makes them an OWNER.
 * Admins can also add and remove members directly.
 */
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType, ENTITY_STATUS } from "@/lib/prismaEnums";
import { canManage, type Actor } from "./access";
import { EntityServiceError, ForbiddenError, NotFoundError } from "./errors";
import { isAdminActor } from "./fields";

const MAX_CLAIM_MESSAGE = 2000;

export async function proposeClaim(actor: Actor, entityId: string, message: unknown) {
  if (!actor.id) throw new ForbiddenError("Sign in to claim a listing");

  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true, name: true, status: true } });
  if (!entity || entity.status !== ENTITY_STATUS.ACTIVE) throw new NotFoundError();

  if (await canManage({ id: actor.id, roles: [] }, entityId)) {
    throw new EntityServiceError("You already manage this listing", 409, "already_member");
  }
  const pending = await prisma.approval.findFirst({
    where: {
      type: ApprovalType.CLAIM_ENTITY,
      status: ApprovalStatus.PENDING,
      targetEntityId: entityId,
      submittedBy: actor.id,
    },
    select: { id: true },
  });
  if (pending) {
    throw new EntityServiceError("You already have a claim waiting for review", 409, "claim_pending");
  }

  const text = typeof message === "string" ? message.trim().slice(0, MAX_CLAIM_MESSAGE) : "";
  const approval = await prisma.approval.create({
    data: {
      type: ApprovalType.CLAIM_ENTITY,
      status: ApprovalStatus.PENDING,
      targetEntityId: entityId,
      payload: { message: text || null },
      submittedBy: actor.id,
      submitterEmail: actor.email ?? null,
      source: "claim",
    },
  });
  return { approval, entity };
}

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
