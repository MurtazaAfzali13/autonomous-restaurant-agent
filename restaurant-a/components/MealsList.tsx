'use client';

import { useState } from 'react';
import { useMeals } from '@/app/menu/hooks/useMeal';
import { DishCard } from '@/app/menu/components/DishCard';
import { MealGridSkeleton } from '@/app/menu/components/MealGridSkeleton';
import { 
  Pagination, 
  PaginationNext, 
  PaginationPrevious,
  PaginationContent,
  PaginationItem 
} from '@/components/ui/pagination';

export default function MealsPreview() {
  const { meals, loading } = useMeals('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(meals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedMeals = meals.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <section className="relative py-24 bg-[#0a0f1a] overflow-hidden selection:bg-emerald-500/30">
      {/* افکت‌های نوری پس‌زمینه */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto container px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Top Picks
          </div>
          <h2 className="font-black text-4xl sm:text-5xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
            Popular <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Meals</span>
          </h2>
          <p className="text-slate-400 text-lg font-light">
            Here are some of our customer favorites — explore and enjoy!
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <MealGridSkeleton count={3} />
        ) : displayedMeals.length > 0 ? (
          <>
            {/* Grid */}
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {displayedMeals.map((meal) => (
                <DishCard key={meal.slug} dish={meal} userId={1} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-16">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-full px-4 py-2 shadow-[0_0_25px_rgba(0,0,0,0.5)] flex items-center w-fit">
                  <Pagination>
                    <PaginationContent className="flex items-center gap-2 sm:gap-4">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={currentPage === 1 ? undefined : handlePrev}
                          className={`cursor-pointer px-4 py-2 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors text-slate-300 border-none ${
                            currentPage === 1 ? 'opacity-30 pointer-events-none' : ''
                          }`}
                        />
                      </PaginationItem>

                      <span className="px-4 py-1.5 bg-slate-800/80 rounded-full text-emerald-400 text-sm font-bold tracking-widest uppercase border border-slate-700/50 shadow-inner">
                        Page {currentPage} <span className="text-slate-500 font-medium">of</span> {totalPages}
                      </span>

                      <PaginationItem>
                        <PaginationNext
                          onClick={currentPage === totalPages ? undefined : handleNext}
                          className={`cursor-pointer px-4 py-2 rounded-full hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors text-slate-300 border-none ${
                            currentPage === totalPages ? 'opacity-30 pointer-events-none' : ''
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl">
            <p className="text-slate-400 text-xl font-light">No meals found yet 🍽️</p>
          </div>
        )}
      </div>
    </section>
  );
}