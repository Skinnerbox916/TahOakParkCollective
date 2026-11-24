/**
 * Every change to an entity starts here. A proposal becomes an Approval row;
 * when the actor is an admin (and autoApprove isn't turned off) it is applied
 * in the same transaction, so the audit row and the write can't diverge.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType, ENTITY_STATUS, ENTITY_TYPE } from "@/lib/prismaEnums";
import { canManage, type Actor } from "./access";
import { createEntity, loadEntityState, updateEntity } from "./apply";
import { ForbiddenError, NoChangesError, NotFoundError, StaleVersionError, ValidationError } from "./errors";
import {
  assertFieldsAllowed,
  diffState,
  isAdminActor,
  normalizeFields,
  pickState,
  type EntityChanges,
} from "./fields";
import { locate } from "./locate";

export type ProposalSource = "owner" | "admin" | "ai" | "ai_suggest" | "public";

interface ProposeOptions {
  source: ProposalSource;
  /** Admin changes apply immediately unless this is false (e.g. AI drafts for review). */
  autoApprove?: boolean;
  submitterEmail?: string | null;
  /** Set false for unauthenticated submissions, so visitors can't drive geocoding calls. */
  geocode?: boolean;
}

const json = (value: unknown) => value as Prisma.InputJsonValue;

/**
 * Propose a new entity. Non-admin proposals wait for review; the entity is
 * created when an admin approves, with the submitter as its OWNER. Admins
 * create directly, unclaimed unless `initialOwnerId` names an owner.
 * Returns the approval and, if it was applied immediately, the new entity's id.
 */
export async function proposeNewEntity(
  actor: Actor,
  input: Record<string, unknown>,
  opts: ProposeOptions & { initialOwnerId?: string }
) {
  const isAdmin = isAdminActor(actor.roles);
  const state = normalizeFields(input);
  if (!state.name) {
    throw new ValidationError("Entity name is required", { name: "validation.nameRequired" });
  }
  state.entityType ??= ENTITY_TYPE.COMMERCE;
  if (!isAdmin) {
    // A new listing's status, slug and admin fields are decided by the reviewer.
    for (const field of ["status", "slug", "featured", "spotCheckDate", "verificationContact", "images"] as const) {
      delete state[field];
    }
  }

  const located = await locate(
    state.address,
    { latitude: state.latitude, longitude: state.longitude },
    opts.geocode !== false && !!state.address && (state.latitude == null || state.longitude == null)
  );
  state.latitude = located.latitude;
  state.longitude = located.longitude;

  const base = {
    type: ApprovalType.NEW_ENTITY,
    payload: json(state),
    checks: json(located.checks),
    submittedBy: actor.id,
    submitterEmail: opts.submitterEmail ?? actor.email ?? null,
    source: opts.source,
  };

  if (isAdmin && opts.autoApprove !== false) {
    return prisma.$transaction(async (tx) => {
      const entityId = await createEntity(tx, state, {
        createdBy: actor.id,
        status: state.status ?? ENTITY_STATUS.ACTIVE,
        owner: opts.initialOwnerId ? { userId: opts.initialOwnerId, addedBy: actor.id } : undefined,
      });
      const approval = await tx.approval.create({
        data: {
          ...base,
          status: ApprovalStatus.APPROVED,
          entityId,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
        },
      });
      return { approval, entityId, pending: false as const };
    });
  }

  const approval = await prisma.approval.create({ data: { ...base, status: ApprovalStatus.PENDING } });
  return { approval, entityId: null, pending: true as const };
}

/**
 * Propose changes to an existing entity. `input` may be a partial set of
 * fields or a whole edit form; only fields that differ from the current
 * entity are kept. Pass `expectedVersion` (the version the form loaded) to
 * refuse saving over changes made in the meantime.
 */
export async function proposeUpdate(
  actor: Actor,
  entityId: string,
  input: Record<string, unknown>,
  opts: ProposeOptions & { expectedVersion?: number }
) {
  const current = await loadEntityState(prisma, entityId);
  if (!(await canManage(actor, entityId))) throw new ForbiddenError();
  if (opts.expectedVersion !== undefined && opts.expectedVersion !== current.version) {
    throw new StaleVersionError(current.version);
  }

  const changes: EntityChanges = diffState(current.state, normalizeFields(input));

  // Keep the map pin in step with the address: geocode a changed address
  // (unless new coordinates came with it) or fill a pin that was never set.
  const address = changes.address !== undefined ? changes.address : current.state.address;
  const coordsGiven = changes.latitude !== undefined || changes.longitude !== undefined;
  const addressChanged = changes.address !== undefined && !coordsGiven;
  const pinMissing = current.state.latitude == null || current.state.longitude == null;
  let checks = {};
  if (addressChanged || (address && pinMissing && !coordsGiven) || coordsGiven) {
    const located = await locate(
      address,
      {
        latitude: changes.latitude !== undefined ? changes.latitude : current.state.latitude,
        longitude: changes.longitude !== undefined ? changes.longitude : current.state.longitude,
      },
      !!address && (addressChanged || (pinMissing && !coordsGiven))
    );
    checks = located.checks;
    Object.assign(changes, diffState(current.state, { latitude: located.latitude, longitude: located.longitude }));
  }

  if (Object.keys(changes).length === 0) throw new NoChangesError();
  assertFieldsAllowed(changes, actor.roles);

  const base = {
    type: ApprovalType.UPDATE_ENTITY,
    targetEntityId: entityId,
    payload: json(changes),
    baseValues: json(pickState(current.state, Object.keys(changes))),
    baseVersion: current.version,
    checks: json(checks),
    submittedBy: actor.id,
    submitterEmail: opts.submitterEmail ?? actor.email ?? null,
    source: opts.source,
  };

  if (isAdminActor(actor.roles) && opts.autoApprove !== false) {
    return prisma.$transaction(async (tx) => {
      const version = await updateEntity(tx, entityId, changes, {
        expectedVersion: current.version,
        createdBy: actor.id,
      });
      const approval = await tx.approval.create({
        data: {
          ...base,
          status: ApprovalStatus.APPROVED,
          entityId,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
        },
      });
      return { approval, entityId, version, changes, pending: false as const };
    });
  }

  const approval = await prisma.approval.create({ data: { ...base, status: ApprovalStatus.PENDING } });
  return { approval, entityId, version: current.version, changes, pending: true as const };
}

/**
 * Admins only: delete a listing outright. Its approval history stays (the
 * links to the entity are cleared). Returns the image URLs so the caller can
 * remove the files. Owners request removal with proposeUpdate({ status: INACTIVE }).
 */
export async function deleteEntity(actor: Actor, entityId: string) {
  if (!isAdminActor(actor.roles)) throw new ForbiddenError();
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { images: true } });
  if (!entity) throw new NotFoundError();
  await prisma.entity.delete({ where: { id: entityId } });
  return { images: (entity.images ?? {}) as Record<string, string> };
}
