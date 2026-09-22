'use client';

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { OrderRow } from "@/lib/order-types";
import { Receipt, UtensilsCrossed } from "lucide-react";

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(() => {
    return fetch("/api/myOrders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.email) {
      router.push("/auth");
      return;
    }

    loadOrders().finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadOrders();
    }, 12000);

    return () => clearInterval(interval);
  }, [session, status, router, loadOrders]);

  const firstName = session?.user?.firstname || "Guest";

  if (status === "loading" || loading) {
    return (
      <section className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center text-slate-200">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm">Loading your orders...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Customer Dashboard
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-400">Track your orders and their live kitchen status.</p>
        </header>

        {!orders.length ? (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <Receipt className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-slate-400 mb-6">Your order history will appear here once you checkout.</p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-500/20 transition-all duration-300"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Explore Menu
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {orders.map((order) => (
              <li
                key={order.id}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order</p>
                    <h2 className="text-xl font-bold text-white">#{order.id}</h2>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <p className="text-sm text-slate-400 mb-1">
                  {new Date(order.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-2xl font-black text-emerald-400 mb-4">${Number(order.total_price).toFixed(2)}</p>

                <div className="mb-4 px-1">
                  <OrderStatusTimeline status={order.status} compact />
                </div>

                <ul className="space-y-2 border-t border-slate-800 pt-4 flex-1">
                  {(order.items || []).map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm text-slate-300">
                      <span className="truncate pr-2">
                        {item.quantity} × {item.title}
                      </span>
                      <span className="text-slate-400 shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
