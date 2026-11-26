/**
 * Reviewing proposals. Approve and reject first claim the PENDING row inside
 * the transaction, so a double click or two admins can't apply it twice, and
 * a failure anywhere rolls the whole approval back.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType } from "@/lib/prismaEnums";
import type { Actor } from "./access";
import { createEntity, loadEntityState, updateEntity, type Tx } from "./apply";
import {
  AlreadyProcessedError,
  ConflictError,
  EntityServiceError,
  NoChangesError,
  NotFoundError,
  ValidationError,
} from "./errors";
import { diffState, findConflicts, mirrorEnglish, normalizeFields, pickState, type EntityChanges, type EntityState } from "./fields";

const json = (value: unknown) => value as Prisma.InputJsonValue;

async function claimPending(tx: Tx, approvalId: string, status: string, reviewer: Actor, notes?: string | null) {
  const { count } = await tx.approval.updateMany({
    where: { id: approvalId, status: ApprovalStatus.PENDING },
    data: {
      status: status as "APPROVED" | "REJECTED",
      reviewedBy: reviewer.id,
      reviewedAt: new Date(),
      notes: notes || null,
    },
  });
  if (count === 0) {
    const exists = await tx.approval.findUnique({ where: { id: approvalId }, select: { id: true } });
    if (!exists) throw new NotFoundError("Approval");
    throw new AlreadyProcessedError();
  }
  return tx.approval.findUniqueOrThrow({ where: { id: approvalId } });
}

export async function approveApproval(reviewer: Actor, approvalId: string, notes?: string | null) {
  return prisma.$transaction(async (tx) => {
    const approval = await claimPending(tx, approvalId, ApprovalStatus.APPROVED, reviewer, notes);

    if (approval.type === ApprovalType.NEW_ENTITY) {
      const state = normalizeFields(approval.payload as Record<string, unknown>);
      // A signed-in submitter becomes the OWNER and publishes it when ready;
      // AI drafts and public suggestions start unclaimed, to be shared with
      // their owner. Either way a listing that needs consent starts private.
      const owner =
        approval.source === "owner" && approval.submittedBy
          ? { userId: approval.submittedBy, addedBy: reviewer.id }
          : undefined;
      const entityId = await createEntity(tx, state, { createdBy: approval.submittedBy, owner });
      await tx.approval.update({ where: { id: approvalId }, data: { entityId } });
      return { approvalId, entityId, newOwnerId: owner?.userId ?? null };
    }

    if (approval.type === ApprovalType.UPDATE_ENTITY) {
      if (!approval.targetEntityId) throw new NotFoundError("Target entity");
      if (!approval.baseValues) {
        throw new EntityServiceError("This approval has no base to check against; edit it to rebase first.", 409, "conflict");
      }
      const current = await loadEntityState(tx, approval.targetEntityId);
      const conflicts = findConflicts(current.state, approval.baseValues as Record<string, unknown>);
      if (conflicts.length > 0) throw new ConflictError(conflicts);

      // Re-run the diff: anything that already matches is simply skipped.
      const changes = diffState(current.state, normalizeFields(approval.payload as Record<string, unknown>));
      if (Object.keys(changes).length > 0) {
        await updateEntity(tx, approval.targetEntityId, changes, {
          expectedVersion: current.version,
          createdBy: approval.submittedBy,
        });
      }
      await tx.approval.update({ where: { id: approvalId }, data: { entityId: approval.targetEntityId } });
      return { approvalId, entityId: approval.targetEntityId, newOwnerId: null };
    }

    throw new ValidationError(`Unsupported approval type ${approval.type}`, {});
  });
}

export async function rejectApproval(reviewer: Actor, approvalId: string, notes?: string | null) {
  return prisma.$transaction(async (tx) => {
    await claimPending(tx, approvalId, ApprovalStatus.REJECTED, reviewer, notes);
    return { approvalId };
  });
}

/**
 * An admin edits a pending proposal. `input` is the whole edited listing. For
 * updates the proposal is rebased: its base becomes the entity as it is now,
 * which is how a conflicting proposal gets resolved before approval.
 */
export async function rebaseApproval(reviewer: Actor, approvalId: string, input: Record<string, unknown>) {
  return prisma.$transaction(async (tx) => {
    const approval = await tx.approval.findUnique({ where: { id: approvalId } });
    if (!approval) throw new NotFoundError("Approval");
    if (approval.status !== ApprovalStatus.PENDING) throw new AlreadyProcessedError();

    let data: Prisma.ApprovalUpdateManyMutationInput;
    if (approval.type === ApprovalType.NEW_ENTITY) {
      const state = mirrorEnglish(normalizeFields(input));
      if (!state.name) throw new ValidationError("Entity name is required", { name: "validation.nameRequired" });
      data = { payload: json(state) };
    } else {
      if (!approval.targetEntityId) throw new NotFoundError("Target entity");
      const current = await loadEntityState(tx, approval.targetEntityId);
      const changes = diffState(current.state, mirrorEnglish(normalizeFields(input), current.state));
      if (Object.keys(changes).length === 0) throw new NoChangesError();
      data = {
        payload: json(changes),
        baseValues: json(pickState(current.state, Object.keys(changes))),
        baseVersion: current.version,
      };
    }

    const { count } = await tx.approval.updateMany({
      where: { id: approvalId, status: ApprovalStatus.PENDING },
      data,
    });
    if (count === 0) throw new AlreadyProcessedError();
    return { approvalId };
  });
}

export interface ApprovalView {
  /** What the entity would look like if approved. */
  proposedState: EntityChanges;
  /** The entity now (UPDATE_ENTITY with a live target only). */
  currentState: EntityState | null;
  currentVersion: number | null;
  /** Changed fields, with their value at submission, now, and proposed. */
  changes: { field: string; before: unknown; current: unknown; proposed: unknown; conflict: boolean }[];
  conflicts: string[];
}

/** Everything the review page needs to show a proposal against the live entity. */
export async function getApprovalView(approval: {
  type: string;
  status: string;
  payload: unknown;
  baseValues: unknown;
  targetEntityId: string | null;
}): Promise<ApprovalView> {
  const payload = (approval.payload ?? {}) as Record<string, unknown>;

  if (approval.type !== ApprovalType.UPDATE_ENTITY || !approval.targetEntityId) {
    let proposedState: EntityChanges;
    try {
      proposedState = normalizeFields(payload);
    } catch {
      proposedState = payload as EntityChanges;
    }
    return { proposedState, currentState: null, currentVersion: null, changes: [], conflicts: [] };
  }

  const current = await loadEntityState(prisma, approval.targetEntityId);
  const baseValues = (approval.baseValues ?? {}) as Record<string, unknown>;
  const conflicts: string[] =
    approval.status === ApprovalStatus.PENDING ? findConflicts(current.state, baseValues) : [];
  const changes = Object.keys(payload).map((field) => ({
    field,
    before: baseValues[field],
    current: current.state[field as keyof EntityState],
    proposed: payload[field],
    conflict: conflicts.includes(field),
  }));

  return {
    proposedState: { ...current.state, ...payload } as EntityChanges,
    currentState: current.state,
    currentVersion: current.version,
    changes,
    conflicts,
  };
}
