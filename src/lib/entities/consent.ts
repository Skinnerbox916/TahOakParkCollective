/**
 * Owner opt-in. A listing that needs consent (policy.ts) goes public only
 * when one of its OWNERs publishes it, agreeing to the listing terms; the
 * agreement is recorded on the entity. Owners can unpublish at any time,
 * with immediate effect.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType, ENTITY_STATUS } from "@/lib/prismaEnums";
import { memberRole, type Actor } from "./access";
import { loadEntityState, updateEntity, type ConsentWrite, type Tx } from "./apply";
import { EntityServiceError, ForbiddenError } from "./errors";
import { isAdminActor } from "./fields";
import { LISTING_TERMS_VERSION } from "./policy";

export class TermsChangedError extends EntityServiceError {
  constructor() {
    super("The listing terms changed since you opened this page. Reload and agree to the current version.", 409, "terms_changed");
  }
}

export function assertCurrentTerms(agreedTermsVersion: unknown) {
  if (agreedTermsVersion !== LISTING_TERMS_VERSION) throw new TermsChangedError();
}

/** Change status (and consent) in one versioned write, with an approval row for the history. */
async function setStatus(
  tx: Tx,
  actor: Actor,
  entityId: string,
  status: string,
  consent: ConsentWrite,
  by: "owner" | "admin",
  note: string
) {
  const current = await loadEntityState(tx, entityId);
  const version = await updateEntity(tx, entityId, { status }, {
    expectedVersion: current.version,
    createdBy: actor.id,
    consent,
  });
  await tx.approval.create({
    data: {
      type: ApprovalType.UPDATE_ENTITY,
      status: ApprovalStatus.APPROVED,
      targetEntityId: entityId,
      entityId,
      payload: { status } as Prisma.InputJsonValue,
      baseValues: { status: current.state.status } as Prisma.InputJsonValue,
      baseVersion: current.version,
      submittedBy: actor.id,
      submitterEmail: actor.email ?? null,
      source: by,
      reviewedBy: by === "admin" ? actor.id : null,
      reviewedAt: new Date(),
      notes: note,
    },
  });
  return version;
}

/** Inside a transaction: the actor, an OWNER, publishes the listing. */
export async function publishInTx(tx: Tx, actor: Actor, entityId: string) {
  if (!actor.id) throw new ForbiddenError("Sign in to publish a listing");
  if ((await memberRole(actor.id, entityId, tx)) !== "OWNER") {
    throw new ForbiddenError("Only the listing's owner can publish it");
  }
  return setStatus(
    tx,
    actor,
    entityId,
    ENTITY_STATUS.ACTIVE,
    { at: new Date(), byId: actor.id, termsVersion: LISTING_TERMS_VERSION },
    "owner",
    `Published by its owner (listing terms ${LISTING_TERMS_VERSION})`
  );
}

/** An OWNER publishes the listing, agreeing to the current listing terms. */
export async function publishListing(actor: Actor, entityId: string, opts: { agreedTermsVersion: unknown }) {
  assertCurrentTerms(opts.agreedTermsVersion);
  return prisma.$transaction((tx) => publishInTx(tx, actor, entityId));
}

/**
 * Take a listing off the site right away. When an OWNER does it, their
 * consent is withdrawn too, so it stays private until an owner publishes it
 * again. An admin hiding a listing (say it closed) keeps the consent, so an
 * admin can restore it.
 */
export async function unpublishListing(actor: Actor, entityId: string) {
  return prisma.$transaction(async (tx) => {
    const isOwner = (await memberRole(actor.id, entityId, tx)) === "OWNER";
    if (!isOwner && !isAdminActor(actor.roles)) {
      throw new ForbiddenError("Only the listing's owner or an admin can unpublish it");
    }
    return setStatus(
      tx,
      actor,
      entityId,
      ENTITY_STATUS.INACTIVE,
      isOwner ? null : undefined,
      isOwner ? "owner" : "admin",
      isOwner ? "Unpublished by its owner (consent withdrawn)" : "Unpublished by an admin"
    );
  });
}
