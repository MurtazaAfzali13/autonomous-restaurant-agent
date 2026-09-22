import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // -----------------------------
    // بررسی دسترسی ادمین
    // -----------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // دریافت تمام سفارش‌ها
    // -----------------------------

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          meal_id,
          quantity,
          price,
          meals (
            id,
            title,
            image
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("❌ Failed to fetch orders:", ordersError);

      return NextResponse.json(
        {
          success: false,
          error: ordersError.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // پاسخ
    // -----------------------------

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}