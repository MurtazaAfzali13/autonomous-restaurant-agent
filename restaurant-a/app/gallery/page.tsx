import GalleryGrid from "./components/GalleryGrid";

export const metadata = {
  title: "Food Gallery | Premium 🍕",
  description: "Explore a luxurious collection of delicious food images.",
};

export interface PexelsPhoto {
  id: number;
  alt: string;
  src: {
    medium: string;
    large: string;
  };
}

async function getFoodImages(): Promise<PexelsPhoto[]> {
  const API_KEY = process.env.PEXELS_API_KEY;

  if (!API_KEY) {
    console.error("Missing PEXELS_API_KEY in .env.local");
    return [];
  }

  const res = await fetch(
    "https://api.pexels.com/v1/search?query=delicious food&per_page=300",
    {
      headers: {
        Authorization: API_KEY,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch food images from Pexels API");
  const data = await res.json();
  return data.photos || [];
}

export default async function GalleryPage() {
  const photos = await getFoodImages();

  return (
    <main className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-24 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center">
      
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center mb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Premium Gallery
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight mb-6">
          Delicious Food Gallery
        </h1>
        
        <p className="text-lg text-slate-400 font-light leading-relaxed">
          Browse through 300 perfectly captured food moments. Powered by the
          <span className="text-emerald-400 font-semibold px-1">Pexels REST API</span>. 
          Use the pagination below to explore the exquisite tastes.
        </p>
      </div>

      <GalleryGrid photos={photos} perPage={30} />
    </main>
  );
}