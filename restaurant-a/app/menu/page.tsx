'use client';

import { useMeals } from './hooks/useMeal';
import { DishCard } from './components/DishCard';
import { MealGridSkeleton } from './components/MealGridSkeleton';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function MealsList() {
  const { meals, category, setCategory, loading } = useMeals('All');
  const { data: session } = useSession();

  // فقط وقتی نقش کاربر admin است، دکمه نمایش داده شود
  const isAdmin = session?.user?.role === 'admin';

  return (
    <section className="py-20 bg-slate-800 min-h-screen">
      <div className="mx-auto container px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-bold text-4xl mb-4 text-gray-100">
            🍽️ Explore Our Delicious Meals
          </h2>
          <p className="text-gray-200 text-lg">
            Choose your favorite category and discover something tasty!
          </p>

          {isAdmin && (
            <Link
              href="/menu/new"
              className="bg-green-500 text-white mt-10 p-2 rounded-2xl font-semibold hover:bg-green-600 transition inline-block"
            >
              Share your favorite meal
            </Link>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex justify-center mb-12">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-4 rounded-lg border border-gray-300 bg-green-500 font-bold cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="All">🍴 All Categories</option>
            <option value="Burger">🍔 Burgers</option>
            <option value="Pizza">🍕 Pizzas</option>
            <option value="Smoothie">🍹 Smoothies</option>
            <option value="Healthy">🥗 Healthy Meals</option>
            <option value="Special">🍛 Special Dishes</option>
          </select>
        </div>

        {/* Loading or Meals */}
        {loading ? (
          <MealGridSkeleton count={6} />
        ) : meals.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => (
              <DishCard key={meal.slug} dish={meal} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">
            No meals found for this category 🍽️
          </p>
        )}
      </div>
    </section>
  );
}
