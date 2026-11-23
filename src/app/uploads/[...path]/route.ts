import { NextRequest } from "next/server";
import { IMAGE_CONTENT_TYPES, readUpload, type ImageExtension } from "@/lib/storage";

/**
 * Serves user uploads from UPLOAD_DIR (see src/lib/storage.ts).
 *
 * Files committed under public/uploads are still served as static files; this
 * handler only sees requests that don't match one. Stored filenames are unique
 * per upload, so responses can be cached forever.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const key = segments.join("/");
  const extension = key.split(".").pop()?.toLowerCase();
  const contentType =
    extension && extension in IMAGE_CONTENT_TYPES
      ? IMAGE_CONTENT_TYPES[extension as ImageExtension]
      : null;

  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const data = await readUpload(key);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
