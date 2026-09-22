"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Meal = {
  id: number;
  title: string;
  image: string;
};

export default function ImageGallery() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // داده تستی (آیدی‌های تکراری را برای جلوگیری از خطای Key در React اصلاح کردم)
  useEffect(() => {
    const sampleMeals: Meal[] = [
      { id: 1, title: "Spicy Italian Pasta", image: "/images/gallery/gallery-1.jpg" },
      { id: 2, title: "Grilled Salmon Steak", image: "/images/gallery/gallery-2.jpg" },
      { id: 3, title: "Classic Beef Burger", image: "/images/gallery/gallery-3.jpg" },
      { id: 4, title: "Fresh Garden Salad", image: "/images/gallery/gallery-4.jpg" },
      { id: 5, title: "Truffle Mushroom Soup", image: "/images/gallery/gallery-5.jpg" },
      { id: 6, title: "Sushi Platter", image: "/images/gallery/gallery-6.jpg" },
      { id: 7, title: "Roasted Chicken", image: "/images/gallery/gallery-7.jpg" },
      { id: 8, title: "Chocolate Lava Cake", image: "/images/gallery/gallery-8.jpg" },
    ];
    setMeals(sampleMeals);
  }, []);

  // Auto Slide
  useEffect(() => {
    if (meals.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % meals.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, meals]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % meals.length);
  const prevSlide = () =>
    setCurrentIndex((prev) => (prev - 1 + meals.length) % meals.length);

  const visibleSlides = 5;
  const half = Math.floor(visibleSlides / 2);

  const getSlideIndexes = () => {
    if (meals.length === 0) return [];
    const indexes: number[] = [];
    const length = meals.length;
    for (let i = -half; i <= half; i++) {
      indexes.push((currentIndex + i + length) % length);
    }
    return indexes;
  };

  const slideIndexes = getSlideIndexes();

  // حالت بارگذاری پریمیوم
  if (meals.length === 0) {
    return (
      <section className="py-24 bg-[#0a0f1a] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm">Loading Gallery...</p>
      </section>
    );
  }

  return (
    <section id="gallery" className="relative py-24 bg-[#0a0f1a] overflow-hidden selection:bg-emerald-500/30">
      
      {/* هاله‌های نوری پس‌زمینه */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 container mx-auto text-center mb-16 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Visual Journey
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-wide mb-4">
          Check <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Our Gallery</span>
        </h2>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        
        {/* Slider Container */}
        <div className="flex justify-center items-center overflow-hidden py-10">
          {slideIndexes.map((idx, position) => {
            const meal = meals[idx];
            if (!meal) return null;

            const isCenter = position === half;

            return (
              <div
                key={`${meal.id}-${idx}`}
                onClick={() => !isCenter && setCurrentIndex(idx)}
                className={`flex-shrink-0 relative mx-2 sm:mx-4 transition-all duration-700 ease-out rounded-3xl ${
                  isCenter
                    ? "w-72 h-72 sm:w-[26rem] sm:h-[26rem] scale-100 z-20 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)] border border-emerald-500/40 cursor-default"
                    : "w-56 h-56 sm:w-64 sm:h-64 scale-90 opacity-40 blur-[2px] hover:opacity-70 hover:blur-0 cursor-pointer z-10 border border-slate-800"
                }`}
              >
                {/* Image */}
                <Image
                  src={meal.image}
                  alt={meal.title}
                  fill
                  priority={isCenter}
                  className="object-cover rounded-3xl"
                />

                {/* Overlay Gradient */}
                <div className={`absolute inset-0 rounded-3xl transition-opacity duration-700 pointer-events-none ${
                  isCenter 
                    ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-100' 
                    : 'bg-slate-950/50'
                }`} />

                {/* Center Image Caption */}
                {isCenter && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 px-4">
                    <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 px-6 py-2.5 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                      <p className="text-white font-semibold tracking-wide text-sm sm:text-base whitespace-nowrap">
                        {meal.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls (Arrows & Pagination) */}
        <div className="flex flex-col items-center mt-8 gap-8">
          
          <div className="flex items-center gap-6">
            {/* Prev Button */}
            <button
              onClick={prevSlide}
              className="group p-4 bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-full text-slate-300 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all duration-300 shadow-lg active:scale-95"
            >
              <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="group p-4 bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-full text-slate-300 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all duration-300 shadow-lg active:scale-95"
            >
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center space-x-3 bg-slate-900/40 px-6 py-3 rounded-full backdrop-blur-sm border border-slate-800/50">
            {meals.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full cursor-pointer transition-all duration-500 ${
                  idx === currentIndex 
                    ? "w-8 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                    : "w-2.5 bg-slate-700 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}