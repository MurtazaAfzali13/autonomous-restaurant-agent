export type OrderStatus = "pending" | "cooking" | "delivered";

export type OrderItemRow = {
  id?: number;
  order_id: number;
  title: string;
  quantity: number;
  price: number;
};

export type OrderRow = {
  id: number;
  customer_name: string;
  customer_email: string;
  total_price: number;
  created_at: string;
  status?: OrderStatus | string | null;
  items?: OrderItemRow[];
};

export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  if (status === "cooking" || status === "delivered" || status === "completed") {
    if (status === "completed") return "delivered";
    return status;
  }
  return "pending";
}

/** Completed orders (DB: `delivered`, legacy/UI: `completed`) may be deleted by admin. */
export function isOrderCompleted(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "delivered" || s === "completed";
}
