"use client";

import { useEffect, useState } from "react";
import type { Building } from "@/types/expense";

// Hardcoded coordinates for known buildings (from OpenStreetMap Nominatim)
const BUILDING_COORDS: Record<string, [number, number]> = {
  "garibaldi-407": [-34.4729, -58.518],
  "laprida-195": [-34.4737, -58.5168],
  "alfaro-180": [-34.4801, -58.5045],
  "manzone-1039": [-34.481, -58.5029],
};

interface BuildingMapProps {
  buildings: Building[];
}

export function BuildingMap({ buildings }: BuildingMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-[300px] rounded-xl border border-border bg-card animate-pulse" />
    );
  }

  return <MapInner buildings={buildings} />;
}

function MapInner({ buildings }: BuildingMapProps) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [components, setComponents] = useState<typeof import("react-leaflet") | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leaflet, rl]) => {
        // Fix default marker icons
        delete (leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        setL(leaflet);
        setComponents(rl);
      }
    );
  }, []);

  if (!L || !components) {
    return (
      <div className="w-full h-[300px] rounded-xl border border-border bg-card animate-pulse" />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = components;

  // Calculate bounds from buildings that have coordinates
  const points = buildings
    .map((b) => ({ building: b, coords: BUILDING_COORDS[b.slug] }))
    .filter((p) => p.coords != null);

  if (points.length === 0) return null;

  const center: [number, number] =
    points.length === 1
      ? points[0].coords!
      : [
          points.reduce((s, p) => s + p.coords![0], 0) / points.length,
          points.reduce((s, p) => s + p.coords![1], 0) / points.length,
        ];

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-[300px] rounded-xl border border-border z-0"
        style={{ background: "#08090a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map(({ building, coords }) => (
          <Marker key={building.id} position={coords!}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{building.name}</p>
                <p className="text-xs opacity-70">{building.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
