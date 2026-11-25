/**
 * Where the site lives and what it's called. Everything that builds a link
 * or shows the brand reads these, so moving to another domain or white-
 * labelling is an environment change, not a code change.
 */
export function siteUrl(): string {
  const url = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/**
 * Where messages for the people running the site go: contact-form messages
 * and admin notifications. Defaults to the public reply-to address.
 */
export function siteInbox(): string | null {
  return process.env.CONTACT_EMAIL || process.env.EMAIL_REPLY_TO || null;
}

export function appName(): string {
  return process.env.APP_NAME || "TahOak Park Collective";
}

export const LOCALES = ["en", "es"] as const;
export type SiteLocale = (typeof LOCALES)[number];

export function toLocale(value: string | null | undefined): SiteLocale {
  return value === "es" ? "es" : "en";
}

/** The next-intl locale cookie from a Cookie header, if any. */
export function localeFromCookieHeader(cookieHeader: string | null | undefined): SiteLocale | null {
  const match = cookieHeader?.match(/(?:^|;\s*)NEXT_LOCALE=(en|es)\b/);
  return match ? (match[1] as SiteLocale) : null;
}
