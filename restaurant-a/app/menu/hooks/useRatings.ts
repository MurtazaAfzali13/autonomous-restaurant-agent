// hooks/useRating.ts
"use client";
import { useState, useCallback } from "react";

interface RatingStats {
  average: number;
  count: number;
  userRating: number | null;
}

export function useRating(mealId: number, userId: number) {
  const [stats, setStats] = useState<RatingStats>({
    average: 0,
    count: 0,
    userRating: null,
  });

  const fetchAverage = useCallback(async () => {
    const res = await fetch(`/api/ratings?meal_id=${mealId}&user_id=${userId}`);
    const data = await res.json();
    setStats({
      average: Number(data.average ?? 0),
      count: Number(data.count ?? 0),
      userRating: data.userRating ?? null,
    });
  }, [mealId, userId]);

  const handleRate = useCallback(
    async (value: number) => {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          meal_id: mealId,
          rating: value,
        }),
      });

      await fetchAverage();
    },
    [mealId, userId, fetchAverage]
  );

  return {
    stats,
    handleRate,
    fetchAverage,
  };
}
