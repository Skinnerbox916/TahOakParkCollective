/**
 * Rate limits and a honeypot for the public forms (Better Auth limits its own
 * endpoints). In-memory: right for a single container; a restart resets it.
 */
import { NextResponse } from "next/server";

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

/** The visitor's IP. Production is behind Cloudflare, which sets cf-connecting-ip. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Record a hit for `key`; false once it's had `max` hits within `windowMs`. */
export function consume(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (now - lastSweep > 10 * 60_000) {
    for (const [k, times] of hits) if (times.every((t) => now - t > 24 * 60 * 60_000)) hits.delete(k);
    lastSweep = now;
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfter: 0 };
}

const HOUR = 60 * 60_000;

/**
 * Apply limits for a public form. Returns a 429 response to send back, or null
 * to carry on. Each limit is [key suffix, max, window ms].
 */
export function limitRequest(
  request: Request,
  form: string,
  limits: Array<[string, number, number]> = [["ip", 5, HOUR]]
): NextResponse | null {
  const ip = clientIp(request);
  for (const [suffix, max, windowMs] of limits) {
    const key = `${form}:${suffix === "ip" ? `ip:${ip}` : suffix}`;
    const { ok, retryAfter } = consume(key, max, windowMs);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }
  return null;
}

/**
 * Public forms include a hidden "homepage" field people never see or fill.
 * Bots fill every field; treat those submissions as accepted and drop them.
 */
export const HONEYPOT_FIELD = "homepage";
export function isBot(body: unknown): boolean {
  const value = (body as Record<string, unknown> | null)?.[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim() !== "";
}

export { HOUR };
