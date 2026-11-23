import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Local-disk storage for user uploads.
 *
 * Files live in UPLOAD_DIR (default: <cwd>/uploads), outside public/. Next only
 * serves public/ files that existed at build time, and the production
 * container's public/ is root-owned and replaced on every deploy. Files here are
 * served by src/app/uploads/[...path]/route.ts at /uploads/<key>.
 *
 * In production, mount a persistent volume at UPLOAD_DIR or uploads are lost on
 * redeploy. To move to object storage (e.g. R2) later, reimplement the three
 * exported I/O functions; callers only deal in keys and public URLs.
 */

export const UPLOADS_URL_PREFIX = "/uploads/";

export const IMAGE_CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type ImageExtension = keyof typeof IMAGE_CONTENT_TYPES;

function getUploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

/** Absolute path for a storage key, or null if the key escapes the upload root. */
function resolveKey(key: string): string | null {
  const root = getUploadRoot();
  const full = path.resolve(root, key);
  return full.startsWith(root + path.sep) ? full : null;
}

/** Public URL for a storage key. */
export function publicUrlForKey(key: string): string {
  return `${UPLOADS_URL_PREFIX}${key}`;
}

/** Storage key for a public URL we issued, or null for anything else. */
export function keyFromPublicUrl(url: string): string | null {
  const pathname = url.split("?")[0];
  if (!pathname.startsWith(UPLOADS_URL_PREFIX)) return null;
  return pathname.slice(UPLOADS_URL_PREFIX.length) || null;
}

export async function saveUpload(key: string, data: Buffer): Promise<string> {
  const filePath = resolveKey(key);
  if (!filePath) throw new Error(`Invalid storage key: ${key}`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return publicUrlForKey(key);
}

export async function readUpload(key: string): Promise<Buffer | null> {
  const filePath = resolveKey(key);
  if (!filePath) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

/** Deletes a stored file. Missing files are not an error. */
export async function deleteUpload(key: string): Promise<void> {
  const filePath = resolveKey(key);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

/**
 * Detects JPEG, PNG or WebP from the file's leading bytes. The browser-supplied
 * MIME type is not trusted.
 */
export function detectImageType(data: Buffer): ImageExtension | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return "jpg";
  }
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}
