// app/api/admin/meals/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

const COLUMNS = "id, slug, title, image, summary, instructions, creator, creator_email, price, category";

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return !!session?.user && session.user.role === "admin";
}

function bad(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

function refreshPublicPages() {
  try {
    revalidatePath("/");
    revalidatePath("/menu");
  } catch {
    /* ignore: only matters if those pages are cached */
  }
}

// ======================================================
// PATCH  /api/admin/meals/:id   → ویرایش غذا
// ======================================================
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) return bad("Forbidden", 403);

    const { id } = await params;
    const mealId = Number(id);
    if (!Number.isInteger(mealId) || mealId <= 0) return bad("Invalid meal id");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid JSON body");

    // فقط فیلدهای مجاز (slug و creator عمداً قابل ویرایش نیستند)
    const updates: Record<string, string | number> = {};

    if (body.title !== undefined) {
      const v = String(body.title).trim();
      if (!v) return bad("Title cannot be empty");
      updates.title = v;
    }
    if (body.price !== undefined) {
      const v = Number(body.price);
      if (!Number.isFinite(v) || v <= 0) return bad("Price must be a number greater than 0");
      updates.price = Math.round(v * 100) / 100;
    }
    if (body.category !== undefined) {
      updates.category = String(body.category).trim() || "Other";
    }
    if (body.image !== undefined) {
      const v = String(body.image).trim();
      if (!v) return bad("Image cannot be empty");
      updates.image = v;
    }
    if (body.summary !== undefined) {
      const v = String(body.summary).trim();
      if (!v) return bad("Summary cannot be empty");
      updates.summary = v;
    }
    if (body.instructions !== undefined) {
      const v = String(body.instructions).trim();
      if (!v) return bad("Instructions cannot be empty");
      updates.instructions = v;
    }

    if (Object.keys(updates).length === 0) return bad("Nothing to update");

    const { data, error } = await supabase
      .from("meals")
      .update(updates)
      .eq("id", mealId)
      .select(COLUMNS)
      .maybeSingle();

    if (error) {
      console.error("❌ Failed to update meal:", error);
      return bad(error.message, 500);
    }
    if (!data) return bad("Meal not found", 404);

    refreshPublicPages();
    return NextResponse.json({ success: true, meal: { ...data, price: Number(data.price) } });
  } catch (err) {
    console.error("❌ Failed to update meal:", err);
    return bad("Failed to update meal", 500);
  }
}

// ======================================================
// DELETE  /api/admin/meals/:id   → حذف غذا
// ======================================================
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) return bad("Forbidden", 403);

    const { id } = await params;
    const mealId = Number(id);
    if (!Number.isInteger(mealId) || mealId <= 0) return bad("Invalid meal id");

    // 1) اگر غذا در سفارش‌های ثبت‌شده وجود دارد، حذف نمی‌کنیم تا تاریخچهٔ سفارش‌ها نشکند
    const { count, error: countError } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("meal_id", mealId);

    if (countError) return bad(countError.message, 500);

    if ((count ?? 0) > 0) {
      return bad(
        `This dish appears in ${count} order item(s) and cannot be deleted without breaking order history.`,
        409,
        { code: "MEAL_HAS_ORDERS", times_ordered: count }
      );
    }

    // 2) پاک‌سازی وابستگی‌های بی‌خطر (سبد خرید و امتیازها)
    const { error: cartError } = await supabase.from("cart_items").delete().eq("meal_id", mealId);
    if (cartError) return bad(cartError.message, 500);

    const { error: ratingError } = await supabase.from("ratings").delete().eq("meal_id", mealId);
    if (ratingError) return bad(ratingError.message, 500);

    // 3) حذف خود غذا
    const { data, error } = await supabase
      .from("meals")
      .delete()
      .eq("id", mealId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("❌ Failed to delete meal:", error);
      return bad(error.message, 500);
    }
    if (!data) return bad("Meal not found", 404);

    refreshPublicPages();
    return NextResponse.json({ success: true, id: mealId });
  } catch (err) {
    console.error("❌ Failed to delete meal:", err);
    return bad("Failed to delete meal", 500);
  }
}
