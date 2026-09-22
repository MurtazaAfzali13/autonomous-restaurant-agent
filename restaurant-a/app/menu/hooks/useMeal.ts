'use client';

import { useEffect, useState } from 'react';
import { Meal } from '../entities/Dish';

export function useMeals(initialCategory: string = 'All') {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [category, setCategory] = useState<string>(initialCategory);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      try {
        const url =
          category === 'All'
            ? '/api/meals'
            : `/api/meals?category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        const data: Meal[] = await res.json();
        setMeals(data);
      } catch (err) {
        console.error('Failed to fetch meals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [category]);

  return { meals, category, setCategory, loading };
}

export function useMeal(slug: string | null) {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchMeal = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 [useMeal] Fetching meal with slug:", slug);
        
        // Fetch meal details
        const res = await fetch(`/api/meals/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch meal: ${res.status}`);
        }
        const data = await res.json();

        // Fetch rating stats
        const statsRes = await fetch(`/api/ratings?meal_id=${data.id}`);
        const statsData = await statsRes.json();

        setMeal({
          ...data,
          stats: {
            average: Number(statsData.average ?? 0),
            count: Number(statsData.count ?? 0),
          },
        });

        console.log("✅ [useMeal] Meal + stats received:", { ...data, stats: statsData });
      } catch (err: any) {
        console.error("❌ [useMeal] Fetch error:", err);
        setError(err.message || "Failed to load meal");
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [slug]);

  return { meal, loading, error };
}
