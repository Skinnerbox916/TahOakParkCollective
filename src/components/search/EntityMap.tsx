"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { EntityWithRelations } from "@/types";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icon issue in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Boundary polygon for TahOak Park area (the "hole" in the spotlight mask)
// Coordinates provided in [Lng, Lat] format, converted to [Lat, Lng] for Leaflet
const BOUNDARY_POLYGON: [number, number][] = [
  [38.566111, -121.468110],  // Converted from [-121.468110, 38.566111]
  [38.549382, -121.427898],  // Converted from [-121.427898, 38.549382]
  [38.525114, -121.427544],  // Converted from [-121.427544, 38.525114]
  [38.524879, -121.467605],  // Converted from [-121.467605, 38.524879]
  [38.538391, -121.473924],  // Converted from [-121.473924, 38.538391]
  [38.560274, -121.474396],  // Converted from [-121.474396, 38.560274]
  [38.566111, -121.468110],  // Close the polygon
];

// Create bounding box from polygon for maxBounds
const polyBounds = L.latLngBounds(BOUNDARY_POLYGON);
const BOUNDARY_BOX: [[number, number], [number, number]] = [
  [polyBounds.getSouth(), polyBounds.getWest()],
  [polyBounds.getNorth(), polyBounds.getEast()],
];

// Point-in-polygon check using ray casting algorithm
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y)) && 
                     (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

interface EntityMapProps {
  entities: EntityWithRelations[];
  center?: [number, number];
  zoom?: number;
}

// Component to auto-center map on boundary polygon on initial load
function AutoCenterOnBoundary() {
  const map = useMap();

  useEffect(() => {
    // Auto-center and zoom to fit the boundary polygon on load
    map.fitBounds(polyBounds, { padding: [50, 50] });
  }, [map]);

  return null;
}

function MapBounds({ entities }: { entities: EntityWithRelations[] }) {
  const map = useMap();

  useEffect(() => {
    // Only consider entities within the polygon boundary
    const entitiesInBounds = entities.filter((e) => {
      if (!e.latitude || !e.longitude) return false;
      return isPointInPolygon([e.latitude, e.longitude], BOUNDARY_POLYGON);
    });

    if (entitiesInBounds.length === 0) {
      // If no entities in bounds, center on the boundary area
      map.fitBounds(polyBounds, { padding: [50, 50] });
      return;
    }

    const bounds = L.latLngBounds(
      entitiesInBounds.map((e) => [e.latitude!, e.longitude!] as [number, number])
    );

    if (bounds.isValid()) {
      // Fit to entities, but ensure we stay within the boundary
      const constrainedBounds = bounds.extend(polyBounds);
      map.fitBounds(constrainedBounds, { padding: [50, 50] });
    }
  }, [entities, map]);

  return null;
}

// Spotlight mask component - creates a polygon covering the world with a hole
function SpotlightMask() {
  // Create a large polygon covering the entire world
  // The hole is defined by BOUNDARY_POLYGON
  const worldPolygon: [number, number][] = [
    [-90, -180],  // Southwest corner of world
    [90, -180],   // Northwest corner of world
    [90, 180],    // Northeast corner of world
    [-90, 180],   // Southeast corner of world
    [-90, -180],  // Close polygon
  ];

  return (
    <Polygon
      positions={[worldPolygon, BOUNDARY_POLYGON]} // Outer polygon, then hole
      pathOptions={{
        fillColor: '#000000',
        fillOpacity: 0.4,
        color: 'transparent',
        weight: 0,
      }}
      interactive={false}
    />
  );
}


export function EntityMap({
  entities,
  center = [polyBounds.getCenter().lat, polyBounds.getCenter().lng] as [number, number],
  zoom = 12,
}: EntityMapProps) {
  const t = useTranslations("search");
  
  // Filter entities to only those within polygon boundary AND with location data
  const entitiesInBounds = entities.filter((e) => {
    if (!e.latitude || !e.longitude) return false;
    return isPointInPolygon([e.latitude, e.longitude], BOUNDARY_POLYGON);
  });

  const entitiesWithLocation = entities.filter(
    (e) => e.latitude && e.longitude
  );

  if (entitiesWithLocation.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">{t("noEntitiesWithLocations")}</p>
          <p className="text-sm">{t("addLocationData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        maxBounds={BOUNDARY_BOX}
        maxBoundsViscosity={1.0} // Prevents panning outside bounds
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Spotlight mask - dims everything outside the boundary */}
        <SpotlightMask />
        {/* Auto-center on boundary polygon on initial load */}
        <AutoCenterOnBoundary />
        {/* Auto-fit bounds to entities */}
        {entitiesInBounds.length > 0 && (
          <MapBounds entities={entitiesInBounds} />
        )}
        {/* Show all entities with locations, but filter display to those in bounds */}
        {entitiesWithLocation.map((entity) => {
          const inBounds = isPointInPolygon(
            [entity.latitude!, entity.longitude!],
            BOUNDARY_POLYGON
          );
          // Only show markers for entities within bounds
          if (!inBounds) return null;
          
          return (
            <Marker
              key={entity.id}
              position={[entity.latitude!, entity.longitude!]}
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {entity.name}
                  </h3>
                  {entity.category && (
                    <p className="text-sm text-gray-600 mb-1">
                      {entity.category.name}
                    </p>
                  )}
                  {entity.address && (
                    <p className="text-xs text-gray-500 mb-2">
                      {entity.address}
                    </p>
                  )}
                  <a
                    href={`/entities/${entity.slug}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {t("viewDetails")}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

