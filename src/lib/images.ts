/**
 * Turns an uploaded photo into the file we store: checked, rotated upright,
 * shrunk to a sensible size and re-encoded as WebP. Re-encoding drops all
 * metadata, so a phone photo's GPS location never reaches the site.
 */
import sharp from "sharp";
import { detectImageType } from "@/lib/storage";

export type ImageKind = "logo" | "cover";
export const IMAGE_KINDS: readonly ImageKind[] = ["logo", "cover"];

/** Largest file we accept, and the largest request body (the file plus form overhead). */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_BODY_BYTES = 10 * 1024 * 1024;

/** Refuses decompression bombs: a small file that unpacks to a huge bitmap. */
const MAX_INPUT_PIXELS = 50_000_000;

export type ImageErrorCode = "notAnImage" | "tooLarge" | "tooSmall";

export class ImageError extends Error {
  constructor(public readonly code: ImageErrorCode) {
    super(`Image refused: ${code}`);
    this.name = "ImageError";
  }
}

/** The stored WebP for an upload, or an ImageError saying why it was refused. */
export async function processListingImage(kind: ImageKind, bytes: Buffer): Promise<Buffer> {
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageError("tooLarge");
  if (!detectImageType(bytes)) throw new ImageError("notAnImage");

  let output: { data: Buffer; info: { width: number; height: number } };
  try {
    output = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate() // apply the camera's orientation before it's stripped
      .resize(
        kind === "logo"
          ? { width: 512, height: 512, fit: "inside", withoutEnlargement: true }
          : { width: 1920, withoutEnlargement: true }
      )
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ImageError("notAnImage");
  }

  // Nothing is enlarged, so a small result means a small original.
  const { width, height } = output.info;
  const bigEnough = kind === "logo" ? Math.max(width, height) >= 64 : width >= 600;
  if (!bigEnough) throw new ImageError("tooSmall");
  return output.data;
}
