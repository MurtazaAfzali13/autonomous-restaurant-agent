// app/api/admin/analytics/route.ts
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
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // -----------------------------
    // دریافت داده‌ها
    // -----------------------------
    const [itemsRes, ratingsRes] = await Promise.all([
      supabase
        .from("order_items")
        .select("quantity, price, meals(title), orders!inner(status)")
        .neq("orders.status", "cancelled"),
      supabase.from("ratings").select("rating"),
    ]);

    if (itemsRes.error || ratingsRes.error) {
      const message = itemsRes.error?.message || ratingsRes.error?.message;
      console.error("❌ Failed to fetch analytics:", message);
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    // -----------------------------
    // پرفروش‌ترین غذاها
    // -----------------------------
    const sellers = new Map<string, { title: string; qty: number; revenue: number }>();

    (itemsRes.data ?? []).forEach((row: any) => {
      const meal = Array.isArray(row.meals) ? row.meals[0] : row.meals;
      const title = meal?.title ?? "Unknown dish";
      const qty = Number(row.quantity || 0);
      const entry = sellers.get(title) ?? { title, qty: 0, revenue: 0 };
      entry.qty += qty;
      entry.revenue += qty * Number(row.price || 0);
      sellers.set(title, entry);
    });

    const topSellers = Array.from(sellers.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // -----------------------------
    // امتیازها
    // -----------------------------
    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;

    (ratingsRes.data ?? []).forEach((r: any) => {
      const v = Number(r.rating);
      if (v >= 1 && v <= 5) {
        distribution[v - 1] += 1;
        sum += v;
      }
    });

    const count = distribution.reduce((a, b) => a + b, 0);

    // -----------------------------
    // پاسخ
    // -----------------------------
    return NextResponse.json({
      success: true,
      topSellers,
      ratings: { avg: count ? sum / count : 0, count, distribution },
    });
  } catch (err) {
    console.error("❌ Failed to fetch analytics:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
