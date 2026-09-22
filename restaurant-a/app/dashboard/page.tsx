"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MealsChart from "./components/MealsChart";
import OrderStatsWidgets from "./components/OrderStatsWidgets";
import { useMeals } from "../menu/hooks/useMeal";
import { OrderRow } from "@/lib/order-types";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { meals, category, loading: mealsLoading } = useMeals();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/403");
      return;
    }

    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.orders || []);
      })
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  }, [session, status, router]);

  if (status === "loading" || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 text-sm tracking-widest uppercase">Loading dashboard...</p>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="relative">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Manager Dashboard
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Restaurant Overview
        </h1>
        <p className="text-slate-400 mt-2">Live metrics, menu performance, and recent activity.</p>
      </header>

      <OrderStatsWidgets orders={orders} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-6">
          <MealsChart meals={meals} category={category} loading={mealsLoading} />
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] transition-all duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Quick Insights</h2>
          </div>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex justify-between border-b border-slate-800 pb-3">
              <span>Menu items</span>
              <strong className="text-emerald-400">{meals.length}</strong>
            </li>
            <li className="flex justify-between border-b border-slate-800 pb-3">
              <span>Total orders</span>
              <strong className="text-white">{orders.length}</strong>
            </li>
            <li className="flex justify-between">
              <span>Active category filter</span>
              <strong className="text-cyan-400">{category}</strong>
            </li>
          </ul>
          <Link
            href="/dashboard/orders"
            className="mt-6 inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
          >
            Manage all orders
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {recentOrders.map((order) => (
              <li key={order.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-200">Order #{order.id}</p>
                  <p className="text-sm text-slate-500">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">${Number(order.total_price).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 capitalize">{order.status ?? "pending"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
