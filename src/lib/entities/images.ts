/**
 * Listing images: a logo and one cover photo, each a file we store.
 *
 * An upload is an ordinary proposal to change one image field, so an admin's
 * applies at once and an owner's waits for review while the live image stays.
 * Files are named uniquely and never overwritten; `sweepListingImages` deletes
 * the ones that neither the listing nor a pending proposal points at.
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalType } from "@/lib/prismaEnums";
import { ImageError, processListingImage, type ImageKind } from "@/lib/images";
import { deleteUpload, keyFromPublicUrl, listUploads, saveUpload } from "@/lib/storage";
import { canManage, type Actor } from "./access";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { IMAGE_FIELDS, isAdminActor, listingUploadFolder, type ImageField } from "./fields";
import { proposeUpdate } from "./propose";

const FIELD: Record<ImageKind, ImageField> = { logo: "logoImage", cover: "coverImage" };

async function assertCanManage(actor: Actor, entityId: string) {
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true } });
  if (!entity) throw new NotFoundError();
  if (!(await canManage(actor, entityId))) throw new ForbiddenError();
}

/**
 * An owner who uploads the same image again means the newer one: their
 * earlier proposals for just that image are closed, so the reviewer sees one.
 */
async function withdrawEarlierUploads(actor: Actor, entityId: string, field: ImageField, keepApprovalId: string) {
  const pending = await prisma.approval.findMany({
    where: {
      status: ApprovalStatus.PENDING,
      type: ApprovalType.UPDATE_ENTITY,
      targetEntityId: entityId,
      submittedBy: actor.id,
      NOT: { id: keepApprovalId },
    },
    select: { id: true, payload: true },
  });
  const ids = pending
    .filter((approval) => {
      const fields = Object.keys((approval.payload ?? {}) as Record<string, unknown>);
      return fields.length === 1 && fields[0] === field;
    })
    .map((approval) => approval.id);
  if (ids.length === 0) return;
  await prisma.approval.updateMany({
    where: { id: { in: ids }, status: ApprovalStatus.PENDING },
    data: { status: ApprovalStatus.REJECTED, reviewedAt: new Date(), notes: "Replaced by a newer upload" },
  });
}

async function afterChange(actor: Actor, entityId: string, field: ImageField, result: { pending: boolean; approval: { id: string } }) {
  try {
    if (result.pending) await withdrawEarlierUploads(actor, entityId, field, result.approval.id);
    await sweepListingImages(entityId);
  } catch (error) {
    console.warn("Image cleanup failed for", entityId, error);
  }
}

/**
 * Store an uploaded image and propose it as the listing's logo or cover.
 * `pending` is true when it waits for an admin's review.
 */
export async function uploadListingImage(actor: Actor, entityId: string, kind: ImageKind, bytes: Buffer) {
  await assertCanManage(actor, entityId);
  const field = FIELD[kind];

  let stored: Buffer;
  try {
    stored = await processListingImage(kind, bytes);
  } catch (error) {
    if (!(error instanceof ImageError)) throw error;
    throw new ValidationError(error.message, { [field]: `validation.image.${error.code}` });
  }

  const key = `${listingUploadFolder(entityId)}/${kind}-${randomBytes(8).toString("hex")}.webp`;
  const url = await saveUpload(key, stored);
  let result;
  try {
    result = await proposeUpdate(actor, entityId, { [field]: url }, { source: isAdminActor(actor.roles) ? "admin" : "owner" });
  } catch (error) {
    await deleteUpload(key).catch(() => {});
    throw error;
  }
  await afterChange(actor, entityId, field, result);
  return { url, pending: result.pending, version: result.version, approvalId: result.approval.id };
}

/** Propose removing the listing's logo or cover. */
export async function removeListingImage(actor: Actor, entityId: string, kind: ImageKind) {
  await assertCanManage(actor, entityId);
  const field = FIELD[kind];
  const result = await proposeUpdate(actor, entityId, { [field]: null }, { source: isAdminActor(actor.roles) ? "admin" : "owner" });
  await afterChange(actor, entityId, field, result);
  return { pending: result.pending, version: result.version, approvalId: result.approval.id };
}

/**
 * Delete the listing's image files that nothing points at: not the listing,
 * and not a proposal still waiting for review. Files newer than `graceMs` are
 * left for the next sweep, so an upload that's still being saved is safe.
 */
export async function sweepListingImages(entityId: string, graceMs = 60_000) {
  const files = await listUploads(listingUploadFolder(entityId));
  if (files.length === 0) return;

  const [entity, pending] = await Promise.all([
    prisma.entity.findUnique({ where: { id: entityId }, select: { images: true } }),
    prisma.approval.findMany({
      where: { status: ApprovalStatus.PENDING, targetEntityId: entityId },
      select: { payload: true },
    }),
  ]);
  const inUse = new Set<string>();
  const keep = (url: unknown) => {
    const key = typeof url === "string" ? keyFromPublicUrl(url) : null;
    if (key) inUse.add(key);
  };
  Object.values((entity?.images ?? {}) as Record<string, unknown>).forEach(keep);
  for (const approval of pending) {
    const payload = (approval.payload ?? {}) as Record<string, unknown>;
    for (const field of Object.keys(IMAGE_FIELDS)) keep(payload[field]);
  }

  const cutoff = Date.now() - graceMs;
  await Promise.all(
    files
      .filter((file) => !inUse.has(file.key) && file.modifiedAt.getTime() <= cutoff)
      .map((file) => deleteUpload(file.key))
  );
}
