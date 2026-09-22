"use client";

import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OrderRow } from "@/lib/order-types";
import { Mail, ShoppingBag, Wallet } from "lucide-react";

type CustomerWithStats = User & {
  totalOrders: number;
  totalSpent: number;
};

function getInitial(user: User): string {
  const fromName = user.firstname?.trim()?.[0];
  if (fromName) return fromName.toUpperCase();
  return (user.email?.[0] ?? "?").toUpperCase();
}

const CustomersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/403");
      return;
    }

    const load = async () => {
      try {
        const [usersRes, ordersRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/admin/orders"),
        ]);
        const usersData = await usersRes.json();
        const ordersData = await ordersRes.json();
        setUsers(usersData.users || []);
        if (ordersData.success) setOrders(ordersData.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, status, router]);

  const customers = useMemo((): CustomerWithStats[] => {
    const statsByEmail = new Map<string, { count: number; spent: number }>();

    for (const order of orders) {
      const email = (order.customer_email || "").toLowerCase();
      if (!email) continue;
      const prev = statsByEmail.get(email) ?? { count: 0, spent: 0 };
      statsByEmail.set(email, {
        count: prev.count + 1,
        spent: prev.spent + Number(order.total_price),
      });
    }

    return users.map((user) => {
      const key = user.email.toLowerCase();
      const stats = statsByEmail.get(key) ?? { count: 0, spent: 0 };
      return {
        ...user,
        totalOrders: stats.count,
        totalSpent: stats.spent,
      };
    });
  }, [users, orders]);

  if (status === "loading" || loading) {
    return (
      <section className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 text-sm tracking-widest uppercase">Loading customers...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Customer Directory
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Customer Profiles
          </h1>
          <p className="text-slate-400 mt-2">Registered guests with order history at a glance.</p>
        </header>

        {customers.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            No customers found yet.
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <li
                key={customer.id}
                className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:-translate-y-2 hover:border-emerald-500/30 hover:shadow-[0_12px_35px_rgba(16,185,129,0.15),0_8px_25px_rgba(59,130,246,0.08)] transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-xl font-black text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      {getInitial(customer)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {[customer.firstname, customer.lastname].filter(Boolean).join(" ") || "Guest"}
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{customer.role}</p>
                  </div>
                </div>

                <p className="flex items-center gap-2 text-sm text-slate-400 mb-6 truncate">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  {customer.email}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Total Orders
                    </p>
                    <p className="text-xl font-black text-cyan-300">{customer.totalOrders}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      <Wallet className="w-3.5 h-3.5" />
                      Total Spent
                    </p>
                    <p className="text-xl font-black text-emerald-400">${customer.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CustomersPage;
