import { EntityWithRelations } from "@/types";

// Default center for Sacramento area
export const SACRAMENTO_CENTER: [number, number] = [38.5816, -121.4944];
export const DEFAULT_ZOOM = 12;

export function calculateMapBounds(
  entities: EntityWithRelations[]
): { center: [number, number]; zoom: number } | null {
  const entitiesWithLocation = entities.filter(
    (e) => e.latitude && e.longitude
  );

  if (entitiesWithLocation.length === 0) {
    return null;
  }

  if (entitiesWithLocation.length === 1) {
    return {
      center: [
        entitiesWithLocation[0].latitude!,
        entitiesWithLocation[0].longitude!,
      ],
      zoom: 15,
    };
  }

  // Calculate bounds
  const lats = entitiesWithLocation.map((e) => e.latitude!);
  const lngs = entitiesWithLocation.map((e) => e.longitude!);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate approximate zoom based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 12;
  if (maxDiff < 0.01) zoom = 14;
  else if (maxDiff < 0.05) zoom = 13;
  else if (maxDiff < 0.1) zoom = 12;
  else if (maxDiff < 0.2) zoom = 11;
  else zoom = 10;

  return {
    center: [centerLat, centerLng],
    zoom,
  };
}






