"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

type City = {
  id: number;
  cityName: string;
  country: string;
  emoji?: string;
  date?: string;
  notes?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
};

const MapView = dynamic<{ cities: City[]; selectedCity: City | null }>(
  () => import("./MapView"),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-800 text-amber-500 animate-pulse">Initializing Map...</div> }
);

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((data: City[]) => {
        // فیلتر کردن برای نمایش فقط شعبه کابل
        const filtered = data.filter((c) => c.cityName === "Kabul");
        setCities(filtered);
        if (filtered.length > 0) {
          setSelectedCity(filtered[0]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 pt-28 pb-16 px-6 font-sans">
      
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <span className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4 block drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          Find Us
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">
          Restaurant Location
        </h1>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* پنل سمت چپ: کارت شعبه */}
        <div className="w-full lg:w-4/12 flex flex-col gap-6">
          {isLoading ? (
            <div className="h-64 rounded-[2rem] bg-slate-800/50 animate-pulse border border-slate-700/50"></div>
          ) : (
            cities.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCity(c)}
                className="group relative bg-slate-900/60 backdrop-blur-xl rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)] hover:border-amber-500/60"
              >
                {c.imageUrl && (
                  <div className="w-full h-48 relative overflow-hidden">
                    <img
                      src={c.imageUrl}
                      alt={c.cityName}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  </div>
                )}

                <div className="p-6 relative z-10 -mt-12">
                  <div className="bg-slate-800/80 backdrop-blur-md inline-block px-4 py-2 rounded-2xl border border-slate-600 mb-4 shadow-lg">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span className="text-xl">{c.emoji}</span> {c.cityName}
                    </h2>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">{c.country}</p>
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {c.notes}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                      <span className="text-slate-500">Latitude</span>
                      <span className="text-amber-500 font-mono">{c.lat.toFixed(4)}</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                      <span className="text-slate-500">Longitude</span>
                      <span className="text-amber-500 font-mono">{c.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* پنل سمت راست: نقشه */}
        <div className="w-full lg:w-8/12 h-[450px] lg:h-auto min-h-[500px] relative rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-slate-800 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent pointer-events-none z-10" />
          <MapView cities={cities} selectedCity={selectedCity} />
        </div>

      </div>
    </main>
  );
}