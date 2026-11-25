// app/dashboard/components/InsightCharts.tsx
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Flame, LayoutGrid, Star, Utensils } from 'lucide-react';
import { Meal } from '@/app/menu/entities/Dish';
import { GlowDonut } from './RevenueCharts';
import { ChartTooltip, COLORS, GlassCard, GRID, PALETTE, TICK, money } from './ui';

/* ------------------------------------------------------------------ */
/* Busy hours / weekdays                                              */
/* ------------------------------------------------------------------ */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BusyHoursChart({ orders }: { orders: any[] }) {
  const [mode, setMode] = useState<'hours' | 'days'>('hours');

  const data = useMemo(() => {
    const size = mode === 'hours' ? 24 : 7;
    const buckets = Array.from({ length: size }, (_, i) => ({
      label: mode === 'hours' ? `${i}:00` : DAYS[i],
      orders: 0,
    }));
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      if (isNaN(d.getTime())) return;
      buckets[mode === 'hours' ? d.getHours() : d.getDay()].orders += 1;
    });
    return buckets;
  }, [orders, mode]);

  const peak = Math.max(...data.map((d) => d.orders), 0);
  const peakLabel = peak > 0 ? data.find((d) => d.orders === peak)?.label : null;

  return (
    <GlassCard
      title="Busiest Times"
      subtitle={peakLabel ? `Peak: ${peakLabel} · ${peak} orders` : 'When customers order'}
      icon={Clock}
      accent={COLORS.amber}
      className="h-full"
      right={
        <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
          {(['hours', 'days'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
                mode === m ? 'bg-amber-400/20 text-amber-200 shadow-[0_0_14px_-4px_#fbbf24]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[150px] w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -26, bottom: 0 }}>
            <defs>
              <linearGradient id="gHot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="gCool" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: TICK, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={mode === 'hours' ? 3 : 0}
            />
            <YAxis tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(251,191,36,0.08)' }} />
            <Bar dataKey="orders" name="Orders" radius={[6, 6, 2, 2]}>
              {data.map((d, i) => (
                <Cell key={i} fill={peak > 0 && d.orders === peak ? 'url(#gHot)' : 'url(#gCool)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Order status                                                       */
/* ------------------------------------------------------------------ */
const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.amber,
  cooking: COLORS.orange,
  preparing: COLORS.orange,
  ready: COLORS.sky,
  delivered: COLORS.emerald,
  completed: COLORS.emerald,
  paid: COLORS.mint,
  cancelled: COLORS.rose,
};

export function OrderStatusDonut({ orders }: { orders: any[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const k = String(o.status || 'pending').toLowerCase();
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v], i) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
      color: STATUS_COLORS[k] ?? PALETTE[i % PALETTE.length],
    }));
  }, [orders]);

  return (
    <GlassCard title="Order Status" subtitle="Kitchen pipeline right now" icon={Flame} accent={COLORS.orange} className="h-full">
      <GlowDonut idPrefix="ostatus" centerValue={String(orders.length)} centerLabel="Orders" data={data} height={150} />
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Menu categories                                                    */
/* ------------------------------------------------------------------ */
export function CategoryDonut({ meals }: { meals: Meal[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    meals.forEach((m: any) => {
      const k = m.category || 'Other';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: PALETTE[(i + 2) % PALETTE.length] }));
  }, [meals]);

  return (
    <GlassCard title="Menu Categories" subtitle="Dishes per category" icon={LayoutGrid} accent={COLORS.fuchsia} className="h-full">
      <GlowDonut idPrefix="cat" centerValue={String(meals.length)} centerLabel="Dishes" data={data} height={150} />
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Top sellers (from /api/admin/analytics)                            */
/* ------------------------------------------------------------------ */
export interface TopSeller {
  title: string;
  qty: number;
  revenue: number;
}

export function TopSellers({ items }: { items: TopSeller[] }) {
  const max = Math.max(...items.map((i) => i.qty), 1);
  return (
    <GlassCard title="Top Sellers" subtitle="Most ordered dishes, all time" icon={Utensils} accent={COLORS.emerald} className="h-full">
      {!items.length ? (
        <p className="py-6 text-center text-sm text-slate-500">No sales data yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 5).map((it, i) => (
            <li key={it.title}>
              <div className="mb-1 flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black text-slate-950"
                  style={{
                    background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 1) % PALETTE.length]})`,
                    boxShadow: `0 0 14px -2px ${PALETTE[i % PALETTE.length]}`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="truncate text-sm font-semibold text-white">{it.title}</span>
                <span className="ml-auto text-sm font-bold text-emerald-300">{it.qty} sold</span>
                <span className="w-20 text-right text-xs text-slate-500">{money(it.revenue)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(it.qty / max) * 100}%`,
                    background: `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.sky})`,
                    boxShadow: `0 0 12px ${COLORS.emerald}`,
                    transition: 'width 900ms cubic-bezier(.2,.8,.2,1)',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Ratings                                                            */
/* ------------------------------------------------------------------ */
export interface RatingSummary {
  avg: number;
  count: number;
  distribution: number[]; // index 0 = 1 star ... index 4 = 5 stars
}

export function RatingsCard({ ratings }: { ratings: RatingSummary | null }) {
  const r = ratings ?? { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
  const max = Math.max(...r.distribution, 1);

  return (
    <GlassCard title="Customer Ratings" subtitle={`${r.count} reviews`} icon={Star} accent={COLORS.amber} className="h-full">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-4xl font-black text-white drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]">{r.avg.toFixed(1)}</p>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={15}
                className={s <= Math.round(r.avg) ? 'fill-amber-300 text-amber-300' : 'text-slate-700'}
              />
            ))}
          </div>
        </div>
        <ul className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = r.distribution[star - 1] || 0;
            return (
              <li key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-400">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(n / max) * 100}%`,
                      background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.orange})`,
                      boxShadow: `0 0 10px ${COLORS.amber}88`,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-slate-500">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassCard>
  );
}
