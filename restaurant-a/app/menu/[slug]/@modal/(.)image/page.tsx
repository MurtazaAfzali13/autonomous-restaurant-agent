// app/menu/[slug]/image/page.tsx
'use client';

import { useParams, useRouter } from "next/navigation";
import { useMeal } from "@/app/menu/hooks/useMeal";
import Image from "next/image";
import { useEffect } from "react";

export default function ImageModalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { meal, loading, error } = useMeal(slug);

  // بستن با ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [router]);

  // بستن با کلیک backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) router.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-white text-lg">Loading image...</div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-red-600 mb-4">Error loading image</h2>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* دکمه بستن */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 right-4 bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl z-10"
      >
        ×
      </button>

      {/* تصویر */}
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <Image
          src={meal.image}
          alt={meal.title}
          width={1200}
          height={800}
          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          quality={90}
          priority
        />
        
        {/* عنوان */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded">
          {meal.title}
        </div>
      </div>
    </div>
  );
}