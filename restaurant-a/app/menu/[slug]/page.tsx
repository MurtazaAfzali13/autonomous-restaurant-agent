'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/share/CartContext";
import { useMeal } from "../hooks/useMeal";
import { useState, useEffect } from "react";

export interface Meal {
  id: number;
  slug: string;
  title: string;
  image: string;
  summary: string;
  instructions: string;
  creator: string;
  creator_email: string;
  price: number;
  category: string;
  stats?: {
    average: number;
    count: number;
  };
}

export default function MealDetailPage() {
  const params = useParams();
  const slug = params?.slug as string | null;
  const { meal, loading, error } = useMeal(slug);
  const { dispatch } = useCart();

  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [average, setAverage] = useState<number>(0);
  const [votes, setVotes] = useState<number>(0);

  useEffect(() => {
    if (meal) {
      const stats = (meal as Meal & { stats?: { average: number; count: number } }).stats;
      setAverage(stats?.average ?? 0);
      setVotes(stats?.count ?? 0);
    }
  }, [meal]);

  const handleAddToCart = () => {
    if (meal) {
      dispatch({ type: 'ADD_ITEM', payload: meal });
      alert(`✅ "${meal.title}" added to cart!`);
    }
  };

  const handleRating = async (rating: number) => {
    setUserRating(rating);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1, meal_id: meal?.id, rating }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit rating');

      const avgRes = await fetch(`/api/ratings?meal_id=${meal?.id}`);
      const stats = await avgRes.json();
      setAverage(stats.average);
      setVotes(stats.count);
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating');
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = hoverRating !== null ? i <= hoverRating : i <= (userRating ?? Math.round(average));
      stars.push(
        <button
          key={i}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(null)}
          onClick={() => handleRating(i)}
          className="focus:outline-none transition-transform hover:scale-125 duration-200"
        >
          <svg
            className={`w-9 h-9 md:w-10 md:h-10 transition-all duration-300 ${
              filled
                ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-110'
                : 'text-slate-700 hover:text-amber-200/50'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-400 font-medium tracking-widest uppercase">Loading Menu...</p>
        </div>
      </div>
    );

  if (error || !meal)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center bg-slate-900/80 p-10 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <p className="text-red-400 text-2xl font-bold mb-6">{error || 'Meal not found'}</p>
          <Link href="/menu" className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-full transition-colors">
            Return to Menu
          </Link>
        </div>
      </div>
    );

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Link 
          href="/menu" 
          className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors mb-10 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-full backdrop-blur-md border border-emerald-500/20"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-5 space-y-8 sticky top-8">
            <div className="relative group rounded-[2.5rem] p-2 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl">
              <Link href={`/menu/${meal.slug}/image`} className="block overflow-hidden rounded-[2rem]">
                <img
                  src={meal.image}
                  alt={meal.title}
                  className="w-full aspect-square object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </Link>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg">
              <h3 className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-4">Rate this meal</h3>
              <div className="flex items-center justify-center gap-2 mb-3">
                {renderStars()}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-amber-400 text-2xl font-black">{average.toFixed(1)}</span>
                <span className="text-slate-500">/ 5.0</span>
                <span className="text-slate-600 px-2">•</span>
                <span className="text-slate-400">{votes} reviews</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {meal.category}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight mb-6">
              {meal.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed font-light mb-10">
              {meal.summary}
            </p>

            <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 shadow-xl">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Price</span>
                <div className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  ${meal.price}
                </div>
              </div>
              
              <button
                className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-lg font-black px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-95 overflow-hidden"
                onClick={handleAddToCart}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Add to Cart
              </button>
            </div>

            <div className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Instructions
              </h2>
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-3xl">
                <p className="text-slate-300 whitespace-pre-wrap leading-loose font-light text-base sm:text-lg">
                  {meal.instructions}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Chef / Creator</p>
                  <p className="text-slate-200 font-semibold truncate">{meal.creator}</p>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-slate-200 font-semibold truncate">{meal.creator_email}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}