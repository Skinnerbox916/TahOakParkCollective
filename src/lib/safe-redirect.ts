/**
 * A callbackUrl we're willing to redirect to: a path on this site only
 * ("/claim?entityId=..."), never another origin ("//evil.com", "https://...").
 */
export function safeCallbackPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
