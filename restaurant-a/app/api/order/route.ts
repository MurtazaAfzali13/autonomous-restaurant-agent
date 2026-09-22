import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { customerName, customerEmail, items } = await request.json();

    // -----------------------------
    // 1. بررسی سبد خرید
    // -----------------------------

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cart is empty",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. گرفتن ID محصولات
    // -----------------------------

    const mealIds = items.map((item: any) => Number(item.id));

    // -----------------------------
    // 3. گرفتن قیمت واقعی از Supabase
    // -----------------------------

    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select("id, price")
      .in("id", mealIds);

    if (mealsError) {
      console.error("❌ Meals fetch error:", mealsError);

      return NextResponse.json(
        {
          success: false,
          error: mealsError.message,
        },
        { status: 500 }
      );
    }

    if (!meals || meals.length !== mealIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more meals were not found",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 4. ساخت Order Items
    // -----------------------------

    const orderItems = items.map((item: any) => {
      const meal = meals.find(
        (m) => m.id === Number(item.id)
      );

      if (!meal) {
        throw new Error(`Meal ${item.id} not found`);
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      return {
        meal_id: meal.id,
        quantity,
        price: Number(meal.price),
      };
    });

    // -----------------------------
    // 5. محاسبه مجموع واقعی
    // -----------------------------

    const totalPrice = orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    // -----------------------------
    // 6. ایجاد سفارش
    // -----------------------------

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail || null,
        total_price: totalPrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("❌ Order insert error:", orderError);

      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        { status: 500 }
      );
    }

    const orderId = order.id;

    console.log("🆔 New Order ID:", orderId);

    // -----------------------------
    // 7. اضافه کردن Order Items
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
      console.error(
        "❌ Order items insert error:",
        itemsError
      );

      // حذف سفارش ناقص
      await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      return NextResponse.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // 8. موفقیت
    // -----------------------------

    return NextResponse.json({
      success: true,
      orderId,
      totalPrice,
    });
  } catch (err: any) {
    console.error("❌ Order save error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to save order",
      },
      { status: 500 }
    );
  }
}