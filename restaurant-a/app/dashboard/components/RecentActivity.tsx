// app/dashboard/components/RecentActivity.tsx
'use client';

import Link from 'next/link';
import { Utensils, BedDouble } from 'lucide-react';
import type { OrderRow } from '@/lib/order-types';
import { normalizeOrderStatus } from '@/lib/order-types';
import { normalizeReservationStatus } from '@/lib/reservation-status';

type Row = {
  kind: 'order' | 'reservation';
  id: number;
  label: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function RecentActivity({
  orders,
  reservations,
}: {
  orders: OrderRow[];
  reservations: any[];
}) {
  const rows: Row[] = [
    ...orders.map((o) => ({
      kind: 'order' as const,
      id: o.id,
      label: o.customer_name,
      amount: Number(o.total_price),
      status: normalizeOrderStatus(o.status),
      created_at: o.created_at,
    })),
    ...reservations.map((r) => ({
      kind: 'reservation' as const,
      id: r.id,
      label: `${r.rooms?.name ?? 'Room'} — ${r.users?.firstname ?? ''} ${r.users?.lastname ?? ''}`.trim(),
      amount: Number(r.total_price),
      status: normalizeReservationStatus(r.status),
      created_at: r.created_at,
    })),
  ]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard/orders" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Orders
          </Link>
          <Link href="/admin/reservations" className="text-sky-400 hover:text-sky-300 font-semibold">
            Reservations
          </Link>
        </div>
      </div>

      {!rows.length ? (
        <p className="text-slate-500 text-center py-8">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg border ${
                    r.kind === 'order'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  }`}
                >
                  {r.kind === 'order' ? <Utensils className="w-4 h-4" /> : <BedDouble className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">
                    {r.kind === 'order' ? `Order #${r.id}` : `Reservation #${r.id}`}
                  </p>
                  <p className="text-sm text-slate-500">{r.label || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${r.kind === 'order' ? 'text-emerald-400' : 'text-sky-400'}`}>
                  ${r.amount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 capitalize">{r.status.replace('_', ' ')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
