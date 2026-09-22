import ShowImageClient from "../../components/ShowImageClient";
import { supabase } from "@/lib/supabase";
type ShowImageServerProps = {
  params: Promise<{ slug: string }>; 
};

export default async function ShowImageServer({ params }: ShowImageServerProps) {
  const { slug } = await params;

  const { data: meal, error } = await supabase
    .from("meals")
    .select("*")
    .eq("slug", slug)
    .single(); 

  if (error || !meal) {
    console.error("Meal not found for slug:", slug, error?.message);
    return null;
  }

  return <ShowImageClient item={meal} />;
}