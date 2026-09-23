"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// City type
export interface City {
  id: number;
  cityName: string;
  country: string;
  emoji?: string;
  notes?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

function MapController({
  setMap,
  cities,
  selectedCity,
}: {
  setMap: (map: any) => void;
  cities: City[];
  selectedCity: City | null;
}) {
  const center: LatLngExpression = selectedCity
    ? [selectedCity.lat, selectedCity.lng]
    : [34.5001, 69.0724];

  // نشانگر با افکت تپش و رنگ آبی درخشان (Blue Glow)
  const pulsingIcon = L.divIcon({
    className: "bg-transparent",
    html: `
      <div class="relative flex h-10 w-10 items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.9)]"></span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  const mapRef = useCallback((node: any) => {
    if (node !== null) {
      setMap(node);
    }
  }, [setMap]);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={14}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
    >
      {/* 
        نقشه استاندارد و رایگان که با CSS به رنگ آبی تاریک درمی‌آید 
        کلاس custom-blue-tiles در پایین فایل تعریف شده است
      */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="custom-blue-tiles"
      />

      {cities.map((city) => (
        <Marker key={city.id} position={[city.lat, city.lng]} icon={pulsingIcon}>
          <Popup className="custom-popup">
            <div className="flex flex-col gap-2 max-w-[220px] bg-slate-900 rounded-xl overflow-hidden text-white border border-slate-700 p-1 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              {city.imageUrl && (
                <div className="w-full h-32 relative overflow-hidden rounded-t-lg">
                  <img
                    src={city.imageUrl}
                    alt={city.cityName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80" />
                  <span className="absolute bottom-2 left-2 text-lg font-bold flex items-center gap-1">
                    <span className="text-sm">{city.emoji}</span> {city.cityName}
                  </span>
                </div>
              )}
              <div className="p-2">
                <span className="text-slate-400 text-xs block mb-1">{city.country}</span>
                {city.notes && (
                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{city.notes}</p>
                )}
                <span className="text-[10px] text-blue-400 mt-2 block font-mono bg-blue-500/10 p-1 rounded border border-blue-500/20">
                  {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function MapView({
  cities,
  selectedCity,
}: {
  cities: City[];
  selectedCity: City | null;
}) {
  const [isReady, setIsReady] = useState(false);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (map && selectedCity) {
      map.flyTo([selectedCity.lat, selectedCity.lng], 14, {
        duration: 2,
        easeLinearity: 0.25,
      });
    }
  }, [map, selectedCity]);

  if (!isReady || !cities?.length) return null;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {isReady && <MapController setMap={setMap} cities={cities} selectedCity={selectedCity} />}
      
      <style jsx global>{`
        /* ترفند جادویی برای تبدیل نقشه روشن به نقشه آبی تیره و خفن */
        .custom-blue-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) sepia(20%);
        }
        
        /* استایل سراسری برای پنهان کردن قاب سفید پیش‌فرض Leaflet Popup */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}