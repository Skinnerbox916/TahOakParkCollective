/**
 * Coverage Area Definitions and Utilities
 * 
 * Uses the TahOak Park Collective boundary polygon to validate if locations
 * are within the coverage area. This uses the same geometry as the map overlay.
 * 
 * Coordinates are in [latitude, longitude] format.
 */

/**
 * Boundary polygon for TahOak Park Collective area
 * This matches the BOUNDARY_POLYGON defined in EntityMap.tsx
 */
const COLLECTIVE_BOUNDARY: [number, number][] = [
  [38.566111, -121.468110],
  [38.549382, -121.427898],
  [38.525114, -121.427544],
  [38.524879, -121.467605],
  [38.538391, -121.473924],
  [38.560274, -121.474396],
  [38.566111, -121.468110], // Close the polygon
];

/**
 * Point-in-polygon check using ray casting algorithm
 * @param point [latitude, longitude]
 * @param polygon Array of [latitude, longitude] points
 * @returns true if point is inside polygon
 */
function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a location is within the TahOak Park Collective coverage area
 * @param lat Latitude
 * @param lng Longitude
 * @returns true if within coverage area
 */
export function isInCoverageArea(lat: number, lng: number): boolean {
  const point: [number, number] = [lat, lng];
  return isPointInPolygon(point, COLLECTIVE_BOUNDARY);
}

/**
 * Validates coordinates and returns coverage status
 * @param lat Latitude
 * @param lng Longitude
 * @returns Object with validation result
 */
export function validateCoverage(lat: number, lng: number): {
  inCoverage: boolean;
  message?: string;
} {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return {
      inCoverage: false,
      message: "Invalid coordinates",
    };
  }

  const inCoverage = isInCoverageArea(lat, lng);

  return {
    inCoverage,
    message: inCoverage
      ? undefined
      : "Location is outside the TahOak Park Collective coverage area",
  };
}

/**
 * Get the boundary polygon coordinates
 * @returns Array of [latitude, longitude] points
 */
export function getBoundaryPolygon(): [number, number][] {
  return COLLECTIVE_BOUNDARY;
}

/**
 * Coverage area options for dropdowns
 */
export const COVERAGE_AREA_OPTIONS = [
  { value: "OAK_PARK", label: "Oak Park" },
  { value: "TAHOE_PARK", label: "Tahoe Park" },
] as const;

export type CoverageArea = typeof COVERAGE_AREA_OPTIONS[number]["value"];

