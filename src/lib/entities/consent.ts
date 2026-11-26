/**
 * Owner opt-in. A listing that needs consent (policy.ts) goes public only
 * with its owner's agreement to the listing terms, recorded on the entity.
 * Either one of its OWNERs publishes it from their account, or an admin
 * publishes it for an owner who agreed offline and records who agreed and
 * how. Either way the owner can have it taken down at any time, with
 * immediate effect.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType, ENTITY_STATUS } from "@/lib/prismaEnums";
import { memberRole, type Actor } from "./access";
import { loadEntityState, updateEntity, type ConsentWrite, type Tx } from "./apply";
import { EntityServiceError, ForbiddenError, ValidationError } from "./errors";
import { isAdminActor } from "./fields";
import { CONSENT_METHODS, LISTING_TERMS_VERSION, requiresConsent, type ConsentMethod } from "./policy";

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
 * An admin publishes a listing for an owner who agreed offline (in person, by
 * phone, ...) and doesn't want an account. The record says who agreed, how,
 * to which terms, and which admin recorded it. The owner can still take the
 * listing over later through a share link; publishing it themselves then
 * replaces this record with their own agreement.
 */
export async function publishOnBehalf(
  actor: Actor,
  entityId: string,
  input: { givenBy: unknown; method: unknown; note?: unknown; agreedTermsVersion: unknown }
) {
  if (!isAdminActor(actor.roles) || !actor.id) throw new ForbiddenError("Only an admin can publish for an owner");
  assertCurrentTerms(input.agreedTermsVersion);

  const givenBy = typeof input.givenBy === "string" ? input.givenBy.trim() : "";
  const method = input.method as ConsentMethod;
  const note = typeof input.note === "string" ? input.note.trim() : "";
  const fieldErrors: Record<string, string> = {};
  if (givenBy.length < 2 || givenBy.length > 200) fieldErrors.givenBy = "validation.consentGivenByRequired";
  if (!CONSENT_METHODS.includes(method)) fieldErrors.method = "validation.consentMethodRequired";
  if (note.length > 1000) fieldErrors.note = "validation.consentNoteTooLong";
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("Say who agreed and how they told you", fieldErrors);
  }

  const recordedById = actor.id;
  return prisma.$transaction(async (tx) => {
    const entity = await tx.entity.findUnique({ where: { id: entityId }, select: { entityType: true } });
    if (entity && !requiresConsent(entity.entityType)) {
      throw new ValidationError("This kind of listing doesn't need an owner's agreement", {});
    }
    return setStatus(
      tx,
      actor,
      entityId,
      ENTITY_STATUS.ACTIVE,
      {
        at: new Date(),
        termsVersion: LISTING_TERMS_VERSION,
        byId: null,
        onBehalf: { recordedById, givenBy, method, note: note || null },
      },
      "admin",
      `Published for its owner: ${givenBy} agreed (${method}) to listing terms ${LISTING_TERMS_VERSION}${note ? `. ${note}` : ""}`
    );
  });
}

/**
 * Take a listing off the site right away.
 *
 * - An OWNER doing it withdraws their consent, so it stays private until an
 *   owner agrees again.
 * - An admin with `withdrawConsent` does the same for an owner who asked
 *   (an owner without an account has no other way).
 * - An admin otherwise just hides it (say it closed); the consent stays, so
 *   an admin can restore it.
 */
export async function unpublishListing(actor: Actor, entityId: string, opts: { withdrawConsent?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    const isOwner = (await memberRole(actor.id, entityId, tx)) === "OWNER";
    const isAdmin = isAdminActor(actor.roles);
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Only the listing's owner or an admin can unpublish it");
    }
    if (isOwner) {
      return setStatus(tx, actor, entityId, ENTITY_STATUS.INACTIVE, null, "owner", "Unpublished by its owner (consent withdrawn)");
    }
    return opts.withdrawConsent
      ? setStatus(tx, actor, entityId, ENTITY_STATUS.INACTIVE, null, "admin", "Unpublished at the owner's request (consent withdrawn)")
      : setStatus(tx, actor, entityId, ENTITY_STATUS.INACTIVE, undefined, "admin", "Unpublished by an admin");
  });
}
