"use client";

import { useEffect } from "react";
import { EntityWithRelations } from "@/types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icon issue in Next.js
// Default marker icon fallback
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

interface BusinessMapProps {
  businesses: EntityWithRelations[];
  center?: [number, number];
  zoom?: number;
}

function MapBounds({ businesses }: { businesses: EntityWithRelations[] }) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length === 0) return;

    const bounds = L.latLngBounds(
      businesses
        .filter((b) => b.latitude && b.longitude)
        .map((b) => [b.latitude!, b.longitude!] as [number, number])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [businesses, map]);

  return null;
}

export function BusinessMap({
  businesses,
  center = [38.5816, -121.4944], // Sacramento center
  zoom = 12,
}: BusinessMapProps) {
  const businessesWithLocation = businesses.filter(
    (b) => b.latitude && b.longitude
  );

  if (businessesWithLocation.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No entities with locations found</p>
          <p className="text-sm">Add location data to see entities on the map</p>
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {businessesWithLocation.length > 0 && (
          <MapBounds businesses={businessesWithLocation} />
        )}
        {businessesWithLocation.map((business) => (
          <Marker
            key={business.id}
            position={[business.latitude!, business.longitude!]}
            icon={icon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {business.name}
                </h3>
                {business.category && (
                  <p className="text-sm text-gray-600 mb-1">
                    {business.category.name}
                  </p>
                )}
                {business.address && (
                  <p className="text-xs text-gray-500 mb-2">
                    {business.address}
                  </p>
                )}
                <a
                  href={`/entities/${business.slug}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

