// app/api/admin/meals/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // -----------------------------
    // بررسی دسترسی ادمین
    // -----------------------------
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // -----------------------------
    // دریافت غذاها + تعداد سفارش هر غذا
    // -----------------------------
    const [mealsRes, itemsRes] = await Promise.all([
      supabase
        .from("meals")
        .select("id, slug, title, image, summary, instructions, creator, creator_email, price, category")
        .order("id", { ascending: false }),
      supabase.from("order_items").select("meal_id"),
    ]);

    if (mealsRes.error || itemsRes.error) {
      const message = mealsRes.error?.message || itemsRes.error?.message;
      console.error("❌ Failed to fetch meals:", message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }

    const counts = new Map<number, number>();
    (itemsRes.data ?? []).forEach((row: any) => {
      counts.set(row.meal_id, (counts.get(row.meal_id) ?? 0) + 1);
    });

    const meals = (mealsRes.data ?? []).map((m: any) => ({
      ...m,
      price: Number(m.price),
      times_ordered: counts.get(m.id) ?? 0,
    }));

    return NextResponse.json({ success: true, meals });
  } catch (err) {
    console.error("❌ Failed to fetch meals:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch meals" }, { status: 500 });
  }
}
