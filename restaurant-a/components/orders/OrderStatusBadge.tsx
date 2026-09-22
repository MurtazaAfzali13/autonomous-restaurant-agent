import { normalizeOrderStatus, OrderStatus } from "@/lib/order-types";

const STATUS_STYLES: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  },
  cooking: {
    label: "Cooking",
    className:
      "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
  },
};

export function OrderStatusBadge({
  status,
  className = "",
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const normalized = normalizeOrderStatus(status);
  const config = STATUS_STYLES[normalized];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </span>
  );
}
