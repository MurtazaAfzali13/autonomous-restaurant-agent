// app/dashboard/components/MealsChart.tsx
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChefHat } from 'lucide-react';
import { Meal } from '@/app/menu/entities/Dish';
import { ChartTooltip, COLORS, GlassCard, GRID, TICK } from './ui';

interface MealsChartProps {
  meals: Meal[];
  category?: string;
  loading: boolean;
}

const short = (s: string) => (s.length > 11 ? `${s.slice(0, 10)}…` : s);

export default function MealsChart({ meals, loading }: MealsChartProps) {
  const [active, setActive] = useState<string>('All');
  const [hover, setHover] = useState<number | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(meals.map((m: any) => m.category || 'Other'));
    return ['All', ...Array.from(set)];
  }, [meals]);

  const data = useMemo(
    () =>
      meals
        .filter((m: any) => active === 'All' || (m.category || 'Other') === active)
        .map((m) => ({ name: m.title, price: Number(m.price) }))
        .sort((a, b) => b.price - a.price)
        .slice(0, 10),
    [meals, active]
  );

  const prices = data.map((d) => d.price);
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const stats = [
    { label: 'Dishes', value: String(meals.length), color: COLORS.violet },
    { label: 'Average', value: `$${avg.toFixed(2)}`, color: COLORS.sky },
    { label: 'Highest', value: `$${prices.length ? Math.max(...prices).toFixed(2) : '0.00'}`, color: COLORS.emerald },
    { label: 'Lowest', value: `$${prices.length ? Math.min(...prices).toFixed(2) : '0.00'}`, color: COLORS.amber },
  ];

  return (
    <GlassCard title="Meals Pricing" subtitle="Top 10 dishes by price" icon={ChefHat} accent={COLORS.violet} className="h-full">
      {loading ? (
        <p className="py-16 text-center text-xs uppercase tracking-widest text-slate-500">Loading chart...</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  active === c
                    ? 'border-violet-400/60 bg-violet-500/20 text-violet-200 shadow-[0_0_16px_-4px_#a78bfa]'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mb-2 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">
                <p className="text-[10px] text-slate-500">{s.label}</p>
                <p className="text-sm font-black" style={{ color: s.color, textShadow: `0 0 14px ${s.color}66` }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="h-[170px] w-full">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }} onMouseLeave={() => setHover(null)}>
                <defs>
                  <linearGradient id="gMeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="55%" stopColor={COLORS.violet} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="name"
                  tickFormatter={short}
                  tick={{ fill: TICK, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={44}
                />
                <YAxis tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ fill: 'rgba(167,139,250,0.08)' }} />
                <Bar dataKey="price" name="Price" radius={[10, 10, 4, 4]} maxBarSize={38} onMouseEnter={(_, i) => setHover(i)}>
                  {data.map((_, i) => (
                    <Cell key={i} fill="url(#gMeal)" fillOpacity={hover === null || hover === i ? 1 : 0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </GlassCard>
  );
}
