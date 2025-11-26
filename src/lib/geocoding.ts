/**
 * Geocoding Utilities
 * 
 * Uses OpenStreetMap Nominatim API for geocoding addresses
 * Note: Be respectful of rate limits (max 1 request per second)
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 * @param address Address string to geocode
 * @returns GeocodeResult or null if not found
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  if (!address || !address.trim()) {
    return null;
  }

  try {
    // Add Sacramento, CA to improve accuracy
    const query = `${address.trim()}, Sacramento, CA`;
    const encodedQuery = encodeURIComponent(query);

    // Use Nominatim API with rate limiting consideration
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TahOakParkCollective/1.0 (contact@tahoak.skibri.us)", // Required by Nominatim ToS
      },
    });

    if (!response.ok) {
      console.error("Geocoding API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name || query,
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Display name/address or null
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TahOakParkCollective/1.0 (contact@tahoak.skibri.us)",
      },
    });

    if (!response.ok) {
      console.error("Reverse geocoding API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    return data.display_name || null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
}

