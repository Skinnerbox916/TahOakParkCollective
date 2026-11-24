/**
 * Share links: an admin builds a listing as a private draft, then sends its
 * owner a link by text or email. The link shows the real listing; the owner
 * signs in, takes it over and (usually) publishes it in the same step.
 *
 * Links are single use and expire. Only a SHA-256 of the token is stored, so
 * a database leak doesn't hand out listings.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { siteUrl, toLocale, type SiteLocale } from "@/lib/site";
import type { Actor } from "./access";
import { assertCurrentTerms, publishInTx } from "./consent";
import { EntityServiceError, ForbiddenError, NotFoundError } from "./errors";
import { isAdminActor } from "./fields";

const LINK_DAYS = 30;

export type ShareLinkState = "open" | "used" | "revoked" | "expired";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function assertAdmin(actor: Actor) {
  if (!isAdminActor(actor.roles)) throw new ForbiddenError("Only admins can share listings");
}

export function shareLinkUrl(token: string, locale: SiteLocale) {
  return `${siteUrl()}/${locale}/preview/${token}`;
}

function stateOf(link: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date }, now = new Date()): ShareLinkState {
  if (link.usedAt) return "used";
  if (link.revokedAt) return "revoked";
  if (link.expiresAt <= now) return "expired";
  return "open";
}

/** Admin: make a link to a listing. The token is returned only here. */
export async function createShareLink(
  actor: Actor,
  entityId: string,
  opts: { email?: string | null; locale?: string | null } = {}
) {
  assertAdmin(actor);
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true, name: true } });
  if (!entity) throw new NotFoundError();

  const token = randomBytes(32).toString("base64url");
  const locale = toLocale(opts.locale);
  const link = await prisma.entityShareLink.create({
    data: {
      entityId,
      tokenHash: hashToken(token),
      sentTo: opts.email?.trim() || null,
      locale,
      createdById: actor.id,
      expiresAt: new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { link, entity, url: shareLinkUrl(token, locale) };
}

/** Admin: the listing's links, newest first, without their tokens. */
export async function listShareLinks(actor: Actor, entityId: string) {
  assertAdmin(actor);
  const links = await prisma.entityShareLink.findMany({
    where: { entityId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sentTo: true,
      locale: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
      usedById: true,
      revokedAt: true,
    },
  });
  const now = new Date();
  return links.map((link) => ({ ...link, state: stateOf(link, now) }));
}

/** Admin: stop a link from working. */
export async function revokeShareLink(actor: Actor, entityId: string, linkId: string) {
  assertAdmin(actor);
  const { count } = await prisma.entityShareLink.updateMany({
    where: { id: linkId, entityId, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new NotFoundError("Open link");
}

/** Anyone holding a token: which listing it's for, and whether it still works. */
export async function lookupShareLink(token: string) {
  if (!token || token.length > 100) return null;
  const link = await prisma.entityShareLink.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, entityId: true, locale: true, usedAt: true, usedById: true, revokedAt: true, expiresAt: true },
  });
  if (!link) return null;
  return { entityId: link.entityId, locale: link.locale, usedById: link.usedById, state: stateOf(link) };
}

/**
 * The signed-in user takes over the listing as its OWNER and, with `publish`,
 * publishes it (agreeing to the listing terms) in the same transaction. The
 * link is used up, and the listing's other open links stop working.
 */
export async function acceptShareLink(
  actor: Actor,
  token: string,
  opts: { publish: boolean; agreedTermsVersion?: unknown }
) {
  if (!actor.id) throw new ForbiddenError("Sign in to take over this listing");
  if (opts.publish) assertCurrentTerms(opts.agreedTermsVersion);
  const userId = actor.id;

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const link = await tx.entityShareLink.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!link) throw new NotFoundError("Link");
    const state = stateOf(link, now);
    if (state !== "open") {
      throw new EntityServiceError(`This link has been ${state === "expired" ? "expired" : state}`, 410, `link_${state}`);
    }

    const { count } = await tx.entityShareLink.updateMany({
      where: { id: link.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now, usedById: userId },
    });
    if (count === 0) throw new EntityServiceError("This link has been used", 410, "link_used");
    await tx.entityShareLink.updateMany({
      where: { entityId: link.entityId, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });

    await tx.entityMember.upsert({
      where: { entityId_userId: { entityId: link.entityId, userId } },
      create: { entityId: link.entityId, userId, role: "OWNER", addedBy: link.createdById },
      update: { role: "OWNER" },
    });
    if (opts.publish) await publishInTx(tx, actor, link.entityId);
    return { entityId: link.entityId, published: opts.publish };
  });
}
