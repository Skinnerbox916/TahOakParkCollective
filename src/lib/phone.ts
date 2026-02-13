/**
 * Lightweight E.164 normalization with a US default.
 * - If already +E.164 with digits, returns as-is.
 * - If 10 digits, returns +1XXXXXXXXXX.
 * - If 11 digits starting with 1, returns +XXXXXXXXXXX.
 * - Otherwise null.
 */
export function parsePhoneToE164(
  input: string,
  _defaultCountry: string = "US"
): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Already has a plus, ensure it is digits-only after +
  if (trimmed.startsWith("+")) {
    const cleaned = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    if (/^\+[0-9]{8,}$/.test(cleaned)) return cleaned;
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");

  // 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11-digit US number with leading 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Format an E.164 phone number for display (US numbers as (XXX) XXX-XXXX).
 * Handles E.164 format (+19164560641) and converts to (916) 456-0641.
 * Falls back to the original string if pattern not recognized.
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  
  const trimmed = String(phone).trim();
  const digits = trimmed.replace(/\D/g, "");

  // E.164 US format: +1XXXXXXXXXX or 1XXXXXXXXXX (11 digits total)
  if (digits.length === 11 && digits.startsWith("1")) {
    const core = digits.slice(1); // Remove country code
    return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
  }

  // 10-digit US number (no country code)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // If it's already in display format or unrecognized, return as-is
  return trimmed;
}

/**
 * Validate an arbitrary phone input string.
 */
export function isValidPhone(input: string, defaultCountry: string = "US"): boolean {
  return parsePhoneToE164(input, defaultCountry) !== null;
}

// Backwards compatibility for existing imports
export { formatPhoneForDisplay as formatPhoneNumber };

