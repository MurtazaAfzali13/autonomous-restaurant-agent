import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { ORDER_STATUSES, OrderStatus, toStatus, transitionError } from "@/lib/order-status";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORDER_SELECT = `
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
`;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order id." },
        { status: 400 }
      );
    }

    let body: { status?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const target = body.status as OrderStatus;

    if (!ORDER_STATUSES.includes(target)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status must be one of: ${ORDER_STATUSES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const { data: current, error: findError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (findError) {
      console.error("❌ Failed to find order:", findError);
      return NextResponse.json(
        { success: false, error: findError.message },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const transitionProblem = transitionError(toStatus(current.status), target);

    if (transitionProblem) {
      return NextResponse.json(
        { success: false, error: transitionProblem },
        { status: 400 }
      );
    }

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({ status: target })
      .eq("id", orderId)
      .select(ORDER_SELECT)
      .single();

    if (updateError) {
      console.error("❌ Failed to update order:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}