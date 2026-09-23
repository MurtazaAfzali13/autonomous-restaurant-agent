import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { City } from "@/lib/types"; 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: cities, error } = await supabase
      .from("cities")
      .select("*");

    if (error) {
      throw error;
    }

    const formattedCities = cities.map((city: any) => ({
      id: city.id,
      cityName: city.city_name,
      country: city.country,
      emoji: city.emoji,
      date: city.date,
      notes: city.notes,
      lat: city.lat,
      lng: city.lng,
      imageUrl: city.image_url,
    }));

    return NextResponse.json(formattedCities);
    
  } catch (error) {
    console.error("Error fetching cities from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}