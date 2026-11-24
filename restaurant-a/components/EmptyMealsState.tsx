'use client';

import Link from 'next/link';

interface EmptyMealsStateProps {
  category: string;
  onResetCategory: () => void;
  isAdmin?: boolean;
}

export function EmptyMealsState({
  category,
  onResetCategory,
  isAdmin = false,
}: EmptyMealsStateProps) {
  return (
    <div className="max-w-lg mx-auto my-8 p-8 rounded-3xl bg-slate-900/70 backdrop-blur-md border border-slate-700/80 shadow-2xl text-center flex flex-col items-center transition-all duration-300 hover:border-green-500/40">
      {/* آیکون جذاب با افکت درخشش */}
      <div className="relative mb-6">
        <div className="absolute -inset-2 rounded-full bg-green-500/20 blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-5xl shadow-inner">
          🍽️
        </div>
      </div>

      {/* تیتر و توضیحات */}
      <h3 className="text-2xl font-bold text-gray-100 mb-3">
        {category === 'All'
          ? 'The Kitchen is Quiet Right Now!'
          : `No ${category}s on the Menu Yet`}
      </h3>

      <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">
        {category === 'All'
          ? "We haven't added any dishes yet. Check back soon for delicious updates!"
          : `Looks like our chefs haven't added any dishes to the "${category}" category yet. Try exploring other delicious options!`}
      </p>

      {/* دکمه‌های اکشن */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {category !== 'All' && (
          <button
            onClick={onResetCategory}
            className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            🍴 View All Categories
          </button>
        )}

        {isAdmin && (
          <Link
            href="/menu/new"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-green-400 border border-green-500/40 font-semibold transition-all duration-200 hover:-translate-y-0.5"
          >
            + Add New Meal
          </Link>
        )}
      </div>
    </div>
  );
}