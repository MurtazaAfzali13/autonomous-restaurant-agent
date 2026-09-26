// app/dashboard/components/StatCards.tsx
'use client';

import { DollarSign, Utensils, BedDouble, Bell } from 'lucide-react';
import type { OrderRow } from '@/lib/order-types';

export default function StatCards({
  orders,
  reservations,
}: {
  orders: OrderRow[];
  reservations: any[];
}) {
  const foodRevenue = orders.reduce((s, o) => s + Number(o.total_price), 0);
  const roomRevenue = reservations
    .filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
    .reduce((s, r) => s + Number(r.total_price), 0);
  const pendingOrders = orders.filter((o) => (o.status ?? 'pending') === 'pending').length;
  const pendingReservations = reservations.filter((r) => r.status === 'pending').length;

  const cards = [
    {
      title: 'Total Revenue',
      value: `$${(foodRevenue + roomRevenue).toFixed(2)}`,
      icon: DollarSign,
      accent: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    },
    {
      title: 'Food Orders',
      value: String(orders.length),
      icon: Utensils,
      accent: 'text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    },
    {
      title: 'Room Reservations',
      value: String(reservations.length),
      icon: BedDouble,
      accent: 'text-sky-400',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
    },
    {
      title: 'Needs Attention',
      value: String(pendingOrders + pendingReservations),
      icon: Bell,
      accent: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      {cards.map(({ title, value, icon: Icon, accent, glow }) => (
        <div
          key={title}
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
      ))}
    </div>
  );
}
