"use client";

import { ClipboardList, DollarSign, Flame, PackageCheck } from "lucide-react";
import { OrderRow } from "@/lib/order-types";
import { normalizeOrderStatus } from "@/lib/order-types";

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function computeOrderStats(orders: OrderRow[]) {
  const todays = orders.filter((o) => isToday(o.created_at));
  return {
    todaysOrders: todays.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_price, 0),
    pendingOrders: orders.filter((o) => normalizeOrderStatus(o.status) === "pending").length,
    activeCooking: orders.filter((o) => normalizeOrderStatus(o.status) === "cooking").length,
  };
}

const widgets = [
  {
    key: "todaysOrders" as const,
    title: "Orders Today",
    icon: ClipboardList,
    accent: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
  },
  {
    key: "totalRevenue" as const,
    title: "Total Revenue",
    icon: DollarSign,
    accent: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    format: (v: number) => `$${v.toFixed(2)}`,
  },
  {
    key: "pendingOrders" as const,
    title: "Pending",
    icon: PackageCheck,
    accent: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  {
    key: "activeCooking" as const,
    title: "In Kitchen",
    icon: Flame,
    accent: "text-cyan-300",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.12)]",
  },
];

export default function OrderStatsWidgets({ orders }: { orders: OrderRow[] }) {
  const stats = computeOrderStats(orders);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
      {widgets.map(({ key, title, icon: Icon, accent, glow, format }) => {
        const raw = stats[key];
        const value = format ? format(raw as number) : String(raw);
        return (
          <div
            key={key}
            className={`group bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-emerald-500/30 ${glow} transition-all duration-500`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
              <div
                className={`p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 ${accent} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
