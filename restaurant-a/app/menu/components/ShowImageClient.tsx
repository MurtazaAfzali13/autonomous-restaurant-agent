// app/menu/components/ShowImageClient.tsx
'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Meal } from "../entities/Dish";

type ShowImageClientProps = {
  item: Meal;
};

export default function ShowImageClient({ item }: ShowImageClientProps) {
  const router = useRouter();

  const handleImageClick = () => {
    router.push(`/menu/${item.slug}/image`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <button 
        onClick={handleImageClick}
        className="focus:outline-none focus:ring-4 focus:ring-blue-500/50 rounded-2xl transition-all hover:scale-105"
        aria-label={`View larger image of ${item.title}`}
      >
        <Image
          src={item.image}
          alt={item.title}
          width={400}  // کمی بزرگ‌تر از قبل
          height={280}
          className="rounded-2xl shadow-xl cursor-pointer object-cover transition-transform duration-300"
          quality={85}
          priority
        />
      </button>
      
      <p className="text-lg mt-4 text-gray-800 dark:text-gray-100 font-semibold text-center max-w-md px-4">
        {item.title}
      </p>
    </div>
  );
}