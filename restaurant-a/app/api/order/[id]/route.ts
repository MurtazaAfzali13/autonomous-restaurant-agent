import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import {
  isOrderCompleted,
  normalizeOrderStatus,
  OrderStatus,
} from "@/lib/order-types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES: OrderStatus[] = [
  "pending",
  "cooking",
  "delivered",
];

// ========================================
// GET - دریافت جزئیات سفارش
// ========================================

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // دریافت سفارش
    // -----------------------------

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // دریافت آیتم‌های سفارش
    // -----------------------------

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        quantity,
        price,
        meals (
          title
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("❌ Failed to fetch order items:", itemsError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch order items",
        },
        { status: 500 }
      );
    }

    // تبدیل ساختار meals به title ساده
    const formattedItems = (items || []).map((item: any) => ({
      quantity: item.quantity,
      price: item.price,
      title: item.meals?.title || "Unknown meal",
    }));

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        status: normalizeOrderStatus(order.status),
      },
      items: formattedItems,
    });
  } catch (err) {
    console.error("❌ Failed to fetch order:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

// ========================================
// PATCH - تغییر وضعیت سفارش
// ========================================

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // -----------------------------
    // بررسی ادمین
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
    // دریافت ID
    // -----------------------------

    const { id } = await context.params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // دریافت وضعیت جدید
    // -----------------------------

    const body = await request.json();
    const nextStatus = body.status as string;

    if (!ALLOWED_STATUSES.includes(nextStatus as OrderStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // بررسی وجود سفارش
    // -----------------------------

    const { data: existingOrder, error: existingError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (existingError || !existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // آپدیت وضعیت
    // -----------------------------

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("❌ Order update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // دریافت سفارش آپدیت‌شده
    // -----------------------------

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_email, total_price, created_at, status"
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        status: normalizeOrderStatus(order.status),
      },
    });
  } catch (err) {
    console.error("❌ Failed to update order:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - حذف سفارش تکمیل‌شده
// ========================================

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // -----------------------------
    // بررسی ادمین
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
    // دریافت ID
    // -----------------------------

    const { id } = await context.params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // دریافت سفارش
    // -----------------------------

    const { data: existingOrder, error: existingError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (existingError || !existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // فقط سفارش تکمیل‌شده حذف شود
    // -----------------------------

    if (!isOrderCompleted(existingOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only completed orders can be deleted",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // حذف Order Items
    // -----------------------------

    const { error: itemsDeleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsDeleteError) {
      console.error(
        "❌ Failed to delete order items:",
        itemsDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: itemsDeleteError.message,
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // حذف خود سفارش
    // -----------------------------

    const { error: orderDeleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (orderDeleteError) {
      console.error(
        "❌ Failed to delete order:",
        orderDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: orderDeleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
    });
  } catch (err) {
    console.error("❌ Failed to delete order:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete order",
      },
      { status: 500 }
    );
  }
}