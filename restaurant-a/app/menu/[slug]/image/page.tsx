// app/menu/[slug]/image/page.tsx
import ShowImageClient from "../../components/ShowImageClient";
import { fetchMealBySlug } from "@/lib/mealService";

type ShowImageServerProps = {
  params: { slug: string };
};

export default async function ShowImageServer({ params }: ShowImageServerProps) {
  const { slug } = params;

  const meal = await fetchMealBySlug(slug);

  if (!meal) {
    console.error("Meal not found for slug:", slug);
    return null;
  }

  // فقط داده را به Client Component می‌دهیم
  return <ShowImageClient item={meal} />;
}