import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Meal } from "@/app/menu/entities/Dish";
import { createClient } from "@supabase/supabase-js";

// تنظیم کلاینت Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/* =======================================================
   GET → دریافت یک meal بر اساس slug
======================================================= */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log("🔍 [GET] Looking for meal with slug:", slug);

    if (!slug) {
      return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    // 👈 استفاده از Supabase به جای SQLite
    const { data: meal, error } = await supabase
      .from("meals")
      .select("*")
      .eq("slug", slug)
      .maybeSingle(); // اگر پیدا نشد null برمی‌گرداند به جای پرتاب خطا

    if (error) throw error;

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json(meal);
  } catch (err: any) {
    console.error("❌ Error fetching meal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =======================================================
   PUT → بروزرسانی meal (فقط admin)
======================================================= */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return new Response("Unauthorized", { status: 401 });
    if (session.user.role !== "admin") return new Response("Forbidden", { status: 403 });

    const { slug } = await params;
    console.log("🔍 [PUT] Updating meal with slug:", slug);

    if (!slug) {
      return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    const body: Meal = await req.json();

    // 👈 آپدیت اطلاعات در Supabase
    const { data: updatedMeal, error } = await supabase
      .from("meals")
      .update({
        title: body.title,
        image: body.image,
        summary: body.summary,
        instructions: body.instructions,
        creator: body.creator,
        creator_email: body.creator_email,
        price: body.price,
        category: body.category,
      })
      .eq("slug", slug)
      .select() // باعث می‌شود رکوردی که آپدیت شده برگردانده شود
      .maybeSingle();

    if (error) throw error;

    // معادل if (info.changes === 0) در SQLite
    if (!updatedMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMeal);
  } catch (err: any) {
    console.error("❌ Error updating meal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =======================================================
   DELETE → حذف meal (فقط admin)
======================================================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return new Response("Unauthorized", { status: 401 });
    if (session.user.role !== "admin") return new Response("Forbidden", { status: 403 });

    const { slug } = await params;
    console.log("🔍 [DELETE] Deleting meal with slug:", slug);

    if (!slug) {
      return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    // 👈 حذف اطلاعات از Supabase
    const { data: deletedMeal, error } = await supabase
      .from("meals")
      .delete()
      .eq("slug", slug)
      .select() // باعث می‌شود رکوردی که حذف شده را به ما برگرداند
      .maybeSingle();

    if (error) throw error;

    // اگر دیتایی برنگردد یعنی غذایی با این slug وجود نداشته است
    if (!deletedMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Meal deleted successfully" });
  } catch (err: any) {
    console.error("❌ Error deleting meal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}