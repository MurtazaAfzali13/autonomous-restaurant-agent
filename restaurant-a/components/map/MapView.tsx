"use client";

import dynamic from "next/dynamic";

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

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-900 animate-pulse rounded-xl" />
  ),
});

export default function MapView({
  cities,
  selectedCity,
}: {
  cities: City[];
  selectedCity: City | null;
}) {
  if (!cities?.length) return null;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapInner cities={cities} selectedCity={selectedCity} />

      <style jsx global>{`
        .custom-blue-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) sepia(20%);
        }

        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
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