import { NextResponse } from "next/server";
import { supabase, getUserId, getActiveCartId } from "@/lib/cart-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ items: [] });

  const cartId = await getActiveCartId(userId);
  if (!cartId) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, meal_id, quantity, price, meals(*)")
    .eq("cart_id", cartId)
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // خروجی دقیقاً به شکل CartItem = Meal + quantity
  const items = (data ?? []).map((r: any) => ({
    ...r.meals,            // id, slug, title, image, summary, instructions, creator, category ...
    id: r.meal_id,
    price: Number(r.price),
    quantity: r.quantity,
  }));
  return NextResponse.json({ items });
}

// delta مثبت = اضافه کردن، منفی = کم کردن (حداقل ۱، مثل reducer فرانت)
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const mealId = Number(body.mealId);
  const delta = Number(body.delta);
  if (!Number.isInteger(mealId) || !Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cartId = (await getActiveCartId(userId, true))!;
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("meal_id", mealId)
    .maybeSingle();

  if (existing) {
    const q = Math.max(existing.quantity + delta, 1);
    await supabase.from("cart_items").update({ quantity: q }).eq("id", existing.id);
  } else if (delta > 0) {
    const { data: meal } = await supabase.from("meals").select("price").eq("id", mealId).single();
    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, meal_id: mealId, quantity: delta, price: meal.price });
  }
  return NextResponse.json({ ok: true });
}

// با mealId: حذف یک غذا | بدون mealId: خالی کردن کل کارت
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cartId = await getActiveCartId(userId);
  if (!cartId) return NextResponse.json({ ok: true });

  const raw = new URL(req.url).searchParams.get("mealId");
  let q = supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (raw !== null) q = q.eq("meal_id", Number(raw));
  await q;

  return NextResponse.json({ ok: true });
}