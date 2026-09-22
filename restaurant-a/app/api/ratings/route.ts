import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// -----------------------------
// اتصال به دیتابیس با کلید ادمین
// -----------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RatingBody {
  user_id: number;
  meal_id: number;
  rating: number;
}

// 📤 POST — ذخیره یا بروزرسانی امتیاز
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RatingBody;
    const { user_id, meal_id, rating } = body;

    if (!user_id || !meal_id || !rating) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 🔹 استفاده از قابلیت فوق‌العاده Upsert در سوپابیس
    // سوپابیس خودش بررسی می‌کند که آیا این کاربر قبلاً به این غذا امتیاز داده یا نه
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { 
          user_id, 
          meal_id, 
          rating,
          created_at: new Date().toISOString() // زمان ثبت را هم بروزرسانی می‌کنیم
        },
        { onConflict: "user_id, meal_id" } // ملاک بررسی تکراری بودن این دو فیلد است
      );

    if (error) {
      console.error("❌ Supabase Upsert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error saving rating:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

// 📥 GET — دریافت میانگین و امتیاز کاربر
export async function GET(req: NextRequest) {
  try {
    const meal_id = req.nextUrl.searchParams.get("meal_id");
    const user_id = req.nextUrl.searchParams.get("user_id");

    if (!meal_id) {
      return NextResponse.json({ error: "meal_id is required" }, { status: 400 });
    }

    // 1️⃣ دریافت تمام امتیازات این غذا برای محاسبه میانگین و تعداد
    const { data: allRatings, error: avgError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("meal_id", meal_id);

    if (avgError) {
      console.error("❌ Error fetching ratings:", avgError);
      throw avgError;
    }

    let average = 0;
    let count = 0;

    // 🔹 محاسبه میانگین در جاوااسکریپت
    if (allRatings && allRatings.length > 0) {
      count = allRatings.length;
      const sum = allRatings.reduce((acc, curr) => acc + curr.rating, 0);
      average = Number((sum / count).toFixed(1)); // میانگین با یک رقم اعشار (مثلا 4.5)
    }

    // 2️⃣ دریافت امتیاز خاص کاربر (اگر user_id ارسال شده باشد)
    let userRating: number | null = null;
    if (user_id) {
      const { data: userRecord, error: userError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("meal_id", meal_id)
        .eq("user_id", user_id)
        .maybeSingle();

      if (userError) {
        console.error("❌ Error fetching user rating:", userError);
        throw userError;
      }

      userRating = userRecord?.rating ?? null;
    }

    return NextResponse.json({
      average,
      count,
      userRating,
    });
  } catch (err: any) {
    console.error("❌ Error in GET ratings:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}