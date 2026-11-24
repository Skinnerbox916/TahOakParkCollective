/**
 * Owner opt-in rules, shared by the server and the UI (no database access
 * here). A listing whose type needs consent is only ACTIVE once an owner has
 * published it. The database enforces the same rule with the CHECK
 * constraint "Entity_active_needs_consent".
 */
import { ENTITY_TYPE } from "@/lib/prismaEnums";

/**
 * Types with no owner to ask (parks, government offices, public schools):
 * admins publish these directly. Keep in step with the CHECK constraint
 * (migration 20261125000000_owner_opt_in).
 */
export const CONSENT_EXEMPT_TYPES: readonly string[] = [ENTITY_TYPE.PUBLIC_SPACE, ENTITY_TYPE.CIVIC];

/**
 * The version of the listing agreement an owner accepts when publishing.
 * Bump it whenever the listingAgreement text in src/messages changes.
 */
export const LISTING_TERMS_VERSION = "2026-11-25";

export function requiresConsent(entityType: string | null | undefined): boolean {
  return !CONSENT_EXEMPT_TYPES.includes(entityType || ENTITY_TYPE.COMMERCE);
}
