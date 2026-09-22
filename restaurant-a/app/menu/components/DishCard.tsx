'use client';

import { Meal } from '../entities/Dish';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useCart } from '@/share/CartContext';
import { useRating } from '../hooks/useRatings';

interface DishCardProps {
  dish: Meal;
  userId?: number;
}

export function DishCard({ dish, userId = 1 }: DishCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { dispatch } = useCart();
  const { stats, handleRate, fetchAverage } = useRating(dish.id, userId);

  useEffect(() => {
    fetchAverage();
  }, [fetchAverage]);

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: dish });
    alert(`✅ "${dish.title}" added to cart!`);
  };

  return (
    <div className="group bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-3xl shadow-lg overflow-hidden hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] hover:-translate-y-2 transition-all duration-500 flex flex-col">
   
      <div className="relative w-full h-56 overflow-hidden">
        {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-56" />}
        <Link href={`/menu/${dish.slug}`}>
          <div className="relative w-full h-full">
            <img
              src={dish.image}
              alt={dish.title}
              className={`w-full h-56 object-cover transform group-hover:scale-110 transition-all duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
         
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none" />
          </div>
        </Link>
      </div>

     
      <div className="flex flex-col flex-grow p-5 relative z-10 -mt-6 bg-slate-900/80 backdrop-blur-xl rounded-t-3xl border-t border-slate-700/50">
        <h3 className="text-xl font-extrabold text-white tracking-wide truncate">
          {dish.title}
        </h3>
        <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
          {dish.summary}
        </p>

        <div className="mt-auto pt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          
          <div className="justify-self-start">
            <p className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              ${dish.price}
            </p>
          </div>
          <div className="justify-self-center flex flex-col items-center bg-slate-800/50 px-3 py-1.5 rounded-2xl border border-slate-700/50">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="focus:outline-none transition-transform hover:scale-125 duration-200"
                >
                  <svg
                    className={`w-5 h-5 transition-colors duration-300 ${
                      star <= (stats.userRating ?? 0)
                        ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]'
                        : 'text-slate-600 hover:text-amber-200'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium tracking-widest uppercase">
              {stats.average.toFixed(1)} <span className="text-slate-500">({stats.count})</span>
            </p>
          </div>

          <div className="justify-self-end">
            <button
              className="group/btn relative cursor-pointer flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-95 overflow-hidden"
              onClick={handleAddToCart}
            >
              <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-5 h-5 mr-1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}