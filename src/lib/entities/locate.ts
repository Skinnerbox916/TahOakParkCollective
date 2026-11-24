import { geocodeAddress } from "@/lib/geocoding";
import { validateCoverage } from "@/lib/coverage-areas";

/** Results of the automated checks, stored on the approval for the reviewer. */
export interface ApprovalChecks {
  geocoded?: boolean;
  geocodeFailed?: boolean;
  inCoverage?: boolean;
  coverageMessage?: string;
}

/**
 * Coordinates and checks for an address. Geocodes only when `needsGeocode`;
 * otherwise just checks the coverage area for the coordinates given.
 */
export async function locate(
  address: string | null | undefined,
  coords: { latitude: number | null | undefined; longitude: number | null | undefined },
  needsGeocode: boolean
): Promise<{ latitude: number | null; longitude: number | null; checks: ApprovalChecks }> {
  let latitude = coords.latitude ?? null;
  let longitude = coords.longitude ?? null;
  const checks: ApprovalChecks = {};

  if (needsGeocode && address) {
    const result = await geocodeAddress(address).catch((error) => {
      console.warn("Geocoding failed:", error);
      return null;
    });
    if (result) {
      latitude = result.latitude;
      longitude = result.longitude;
      checks.geocoded = true;
    } else {
      latitude = null;
      longitude = null;
      checks.geocodeFailed = true;
    }
  }

  if (latitude !== null && longitude !== null) {
    const coverage = validateCoverage(latitude, longitude);
    checks.inCoverage = coverage.inCoverage;
    if (coverage.message) checks.coverageMessage = coverage.message;
  }

  return { latitude, longitude, checks };
}
