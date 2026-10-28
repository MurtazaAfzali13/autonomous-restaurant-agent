import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserId, getActiveCartId } from "@/lib/cart-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

class BadRequestError extends Error {}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    const body = await request.json();
    const items = body.items;

    const customerEmail: string | null =
      sessionUser?.email ?? body.customerEmail ?? null;

    const sessionName = `${sessionUser?.firstname ?? ""} ${sessionUser?.lastname ?? ""}`.trim();
    const customerName: string = sessionName || body.customerName || "Customer";

    // -----------------------------
    // 1. Validate the cart payload
    // -----------------------------
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. Collect unique meal IDs
    // -----------------------------
    const mealIds: number[] = [...new Set(items.map((item: any) => Number(item.id)))] as number[];

    if (mealIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return NextResponse.json(
        { success: false, error: "Invalid meal id" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3. Fetch real prices from Supabase
    // -----------------------------
    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select("id, price")
      .in("id", mealIds);

    if (mealsError) {
      console.error("❌ Meals fetch error:", mealsError);
      return NextResponse.json(
        { success: false, error: mealsError.message },
        { status: 500 }
      );
    }

    if (!meals || meals.length !== mealIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more meals were not found" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 4. Build order items (merge duplicates, validate quantity)
    // -----------------------------
    const merged = new Map<number, number>();

    for (const item of items) {
      const mealId = Number(item.id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestError("Invalid quantity");
      }
      merged.set(mealId, (merged.get(mealId) ?? 0) + quantity);
    }

    const orderItems = [...merged.entries()].map(([mealId, quantity]) => {
      const meal = meals.find((m) => m.id === mealId);
      if (!meal) throw new BadRequestError(`Meal ${mealId} not found`);

      return {
        meal_id: meal.id as number,
        quantity,
        price: Number(meal.price),
      };
    });

    // -----------------------------
    // 5. Compute the real total
    // -----------------------------
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // -----------------------------
    // 6. Create the order
    // -----------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        total_price: totalPrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("❌ Order insert error:", orderError);
      return NextResponse.json(
        { success: false, error: orderError?.message ?? "Failed to create order" },
        { status: 500 }
      );
    }

    const orderId = order.id as number;
    console.log("🆔 New Order ID:", orderId);

    // -----------------------------
    // 7. Insert order items
    // -----------------------------
    const itemsToInsert = orderItems.map((item) => ({
      order_id: orderId,
      meal_id: item.meal_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("❌ Order items insert error:", itemsError);

      // Roll back the incomplete order
      await supabase.from("orders").delete().eq("id", orderId);

      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
    }

    // -----------------------------
    // 8. Clear the database cart (same as create_order_from_cart in Python)
    //    The order is already saved, so a failure here must not fail the request.
    // -----------------------------
    try {
      const userId = await getUserId();
      if (userId) {
        const cartId = await getActiveCartId(userId);
        if (cartId) {
          await supabase.from("cart_items").delete().eq("cart_id", cartId);
          await supabase.from("carts").update({ status: "checked_out" }).eq("id", cartId);
        }
      }
    } catch (cartErr) {
      console.error("⚠️ Order saved, but clearing the cart failed:", cartErr);
    }

    // -----------------------------
    // 9. Success
    // -----------------------------
    return NextResponse.json({
      success: true,
      orderId,
      totalPrice,
    });
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

    console.error("❌ Order save error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save order" },
      { status: 500 }
    );
  }
}