export const ORDER_STATUSES = ["pending", "cooking", "ready", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Happy-path flow. Edit here to change it everywhere. */
export const FLOW: OrderStatus[] = ["pending", "cooking", "ready", "delivered"];

export const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#fbbf24" },
  cooking: { label: "Cooking", color: "#fb923c" },
  ready: { label: "Ready", color: "#38bdf8" },
  delivered: { label: "Delivered", color: "#10b981" },
  cancelled: { label: "Cancelled", color: "#fb7185" },
};

export function toStatus(s: string | null | undefined): OrderStatus {
  const v = (s ?? "pending").toLowerCase();
  if (v === "completed") return "delivered";
  return (ORDER_STATUSES as readonly string[]).includes(v) ? (v as OrderStatus) : "pending";
}

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}

/** Returns an error message, or null if the transition is allowed. */
export function transitionError(from: OrderStatus, to: OrderStatus): string | null {
  if (from === "delivered" || from === "cancelled") return `A ${from} order cannot be changed again.`;
  if (from === to) return `Order is already ${to}.`;
  if (to === "cancelled") {
    return from === "pending" || from === "cooking" ? null : "Only pending or cooking orders can be cancelled.";
  }
  return to === nextStatus(from) ? null : `Invalid transition: ${from} → ${to}. Next step is ${nextStatus(from)}.`;
}
