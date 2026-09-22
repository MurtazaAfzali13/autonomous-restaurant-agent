import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    const email = session?.user?.email ?? emailParam;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // کاربر لاگین کرده فقط سفارش‌های خودش را می‌تواند ببیند
    if (session?.user?.email && email !== session.user.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    // دریافت سفارش‌ها
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("❌ Supabase orders error:", ordersError);

      return NextResponse.json(
        {
          success: false,
          error: ordersError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders ?? [],
    });
  } catch (error: any) {
    console.error("❌ Error fetching orders:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}