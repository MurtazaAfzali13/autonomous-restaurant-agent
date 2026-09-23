"use client";

import { useEffect, useState } from "react";
import type { PexelsPhoto } from "../page";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GalleryGridProps {
  photos: PexelsPhoto[];
  perPage?: number;
}

export default function GalleryGrid({ photos, perPage = 30 }: GalleryGridProps) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PexelsPhoto | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);

  const totalPages = Math.ceil(photos.length / perPage);
  const startIndex = (page - 1) * perPage;
  const visiblePhotos = photos.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    setLoadingImages(true);
    const timer = setTimeout(() => setLoadingImages(false), 1000);
    return () => clearTimeout(timer);
  }, [page]);

  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages));
  const handlePrev = () => setPage((p) => Math.max(p - 1, 1));

  return (
    <div className="relative w-full max-w-7xl mx-auto z-10">
      
      {/* تغییر در کلاس‌های گرید این قسمت اعمال شده است */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
        {loadingImages
          ? Array.from({ length: perPage }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col space-y-3 rounded-[2rem] bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 p-3 shadow-lg"
              >
                <Skeleton className="h-64 w-full rounded-3xl bg-slate-800/80" />
                <div className="space-y-2 px-2 pb-2 mt-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-800/80 rounded-full" />
                  <Skeleton className="h-4 w-1/2 bg-slate-800/80 rounded-full" />
                </div>
              </div>
            ))
          : visiblePhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="group relative overflow-hidden rounded-[2rem] cursor-pointer bg-slate-900 shadow-lg border border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all duration-500"
              >
                <div className="relative w-full h-72">
                  <img
                    src={photo.src.large}
                    alt={photo.alt || "Food image"}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:translate-y-0 translate-y-4">
                    <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 p-4 rounded-full text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="flex justify-center mb-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-full px-4 py-2 shadow-[0_0_25px_rgba(0,0,0,0.5)] flex items-center w-fit">
          <Pagination>
            <PaginationContent className="flex justify-between items-center gap-2 sm:gap-6">
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePrev}
                  className={`cursor-pointer px-4 py-2 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors text-slate-300 ${
                    page === 1 ? "opacity-30 pointer-events-none" : ""
                  }`}
                />
              </PaginationItem>

              <span className="px-4 py-1 bg-slate-800/80 rounded-full text-emerald-400 text-sm font-bold tracking-widest uppercase border border-slate-700/50 shadow-inner">
                Page {page} <span className="text-slate-500 font-medium">of</span> {totalPages}
              </span>

              <PaginationItem>
                <PaginationNext
                  onClick={handleNext}
                  className={`cursor-pointer px-4 py-2 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors text-slate-300 ${
                    page === totalPages ? "opacity-30 pointer-events-none" : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-5xl bg-slate-950/90 backdrop-blur-2xl border border-slate-800 shadow-[0_0_50px_rgba(16,185,129,0.15)] rounded-[2.5rem] p-0 overflow-hidden">
          {selected && (
            <>
              <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
                <DialogTitle className="text-xl font-bold text-white drop-shadow-md">
                  {selected.alt || "Delicious Food"}
                </DialogTitle>
              </DialogHeader>

              <div className="relative w-full flex justify-center items-center bg-slate-950">
                <img
                  src={selected.src.large}
                  alt={selected.alt}
                  className="w-full max-h-[80vh] object-contain"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}