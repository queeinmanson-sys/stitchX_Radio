"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix marker icons (Next.js issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const route: [number, number][] = [
  [41.3851, 2.1734], // Barcelona
  [41.5, 2.0],
  [41.6, 1.8],
  [41.65, 1.7], // Montserrat
];

export default function RaceMap({ positions, cameraMode = "auto" }: { positions?: any, cameraMode?: string }) {
  if (!positions) return null;

  // Smooth peloton and breakaway movement
  const [smoothPeloton, setSmoothPeloton] = useState<{lat: number, lng: number}>(positions.peloton);
  const [smoothBreakaway, setSmoothBreakaway] = useState<{lat: number, lng: number}>(positions.breakaway);

  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothPeloton((prev: {lat: number, lng: number}) => ({
        lat: prev.lat + (positions.peloton.lat - prev.lat) * 0.1,
        lng: prev.lng + (positions.peloton.lng - prev.lng) * 0.1,
      }));
      setSmoothBreakaway((prev: {lat: number, lng: number}) => ({
        lat: prev.lat + (positions.breakaway.lat - prev.lat) * 0.1,
        lng: prev.lng + (positions.breakaway.lng - prev.lng) * 0.1,
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [positions.peloton.lat, positions.peloton.lng, positions.breakaway.lat, positions.breakaway.lng]);

  useEffect(() => {
    setSmoothPeloton(positions.peloton);
    setSmoothBreakaway(positions.breakaway);
  }, [positions.peloton.lat, positions.peloton.lng, positions.breakaway.lat, positions.breakaway.lng]);

  // Camera follow and smart zoom system
  function CameraController({ positions, mode }: { positions: any, mode: string }) {
    const map = useMap();
    useEffect(() => {
      if (!positions) return;
      let target = positions.peloton;
      let zoom = 11;
      if (mode === "peloton") {
        target = positions.peloton;
      }
      if (mode === "breakaway") {
        target = positions.breakaway;
        zoom = 12;
      }
      if (mode === "auto") {
        // If breakaway is far, zoom out
        const dist = Math.abs(positions.breakaway.lat - positions.peloton.lat);
        if (dist > 0.05) {
          zoom = 10;
        }
        // If incident, focus there
        if (positions.incident) {
          target = positions.incident;
          zoom = 12;
        }
      }
      map.flyTo([target.lat, target.lng], zoom, { duration: 1.5 });
    }, [positions, mode]);
    return null;
  }

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer center={[41.5, 2.0]} zoom={10} className="h-full w-full">
        <CameraController positions={positions} mode={cameraMode} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route */}
        <Polyline positions={route} color="cyan" />

        {/* Peloton */}
        <Marker position={[smoothPeloton.lat, smoothPeloton.lng]}>
          <Popup>Peloton</Popup>
        </Marker>

        {/* Breakaway */}
        <Marker position={[smoothBreakaway.lat, smoothBreakaway.lng]}>
          <Popup>Breakaway</Popup>
        </Marker>

        {/* Incident */}
        <Marker position={[positions.incident.lat, positions.incident.lng]}>
          <Popup>Incident</Popup>
        </Marker>

        {/* Finish */}
        <Marker position={[41.65, 1.7]}>
          <Popup>Finish – Montserrat</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
