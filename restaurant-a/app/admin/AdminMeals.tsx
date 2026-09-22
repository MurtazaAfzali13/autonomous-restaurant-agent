'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Meal } from "../menu/entities/Dish";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const router = useRouter();

  // فقط اگر کاربر admin است، داده‌ها را fetch کن
  useEffect(() => {
   if (session?.user?.role === "admin") {
  fetch('/api/meals')
    .then(res => res.json())
    .then(setMeals);
}
  }, [session]);

  const handleEdit = (meal: Meal) => {
    router.push(`/admin/update/${meal.id}`);
  };

  const handleDelete = (id: number) => {
    router.push(`/admin/delete/${id}`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = meals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(meals.length / itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // نمایش پیام وقتی کاربر login نیست یا admin نیست
  if (status === "loading") {
    return <p className="text-center py-20">Loading...</p>;
  }

  if (!session || session.user.role !== "admin") {
    return <p className="text-center py-20 text-red-500 font-bold">Access denied. Only admins can view this page.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Meals</h1>

      <div className='flex justify-center p-2'>
        <Link
          href="/menu/new"
          className="bg-green-500 text-white mt-10 p-3 rounded-2xl font-semibold hover:bg-green-600 transition inline-block"
        >
          Share your favorite meal
        </Link>
      </div>

      <ul className="space-y-2">
        {currentItems.map(meal => (
          <li key={meal.id} className="border p-2 flex justify-between items-center rounded-lg">
            <span>{meal.title} - ${meal.price}</span>
            <div className="space-x-2">
              <button
                className="bg-yellow-400 text-black px-2 py-1 rounded"
                onClick={() => handleEdit(meal)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => handleDelete(meal.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrev}
                className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={handleNext}
                className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
