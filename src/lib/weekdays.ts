/** Days of the week as stored in `Entity.hours`, Monday first. */
export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/**
 * A weekday's name in `locale` ("Monday"/"lunes", "Mon"/"lun"), capitalized.
 * Uses Intl, so every language gets correct names without a translation list.
 */
export function weekdayName(locale: string, index: number, style: "long" | "short" = "long"): string {
  // 2024-01-01 was a Monday
  const name = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 1 + index))
  );
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}
