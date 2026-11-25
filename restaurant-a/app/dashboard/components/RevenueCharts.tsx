// app/dashboard/components/RevenueCharts.tsx
'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BedDouble, CalendarCheck, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { ChartTooltip, COLORS, GlassCard, GRID, TICK } from './ui';

/* ------------------------------------------------------------------ */
/* Revenue trend                                                      */
/* ------------------------------------------------------------------ */
export function RevenueTrendChart({
  data,
}: {
  data: { date: string; Food: number; Rooms: number }[];
}) {
  return (
    <GlassCard
      title="Revenue Overview"
      subtitle="Food orders vs room reservations"
      icon={TrendingUp}
      accent={COLORS.emerald}
      className="h-full"
      right={
        <div className="hidden items-center gap-4 text-xs text-slate-400 sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Food
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" /> Rooms
          </span>
        </div>
      }
    >
      <div
        className="h-[200px] w-full [&_.recharts-area-curve]:[filter:drop-shadow(0_0_6px_rgba(52,211,153,0.55))]"
      >
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gFood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.mint} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRooms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.sky} stopOpacity={0.5} />
                <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sFood" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.emerald} />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: TICK, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: TICK, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
            />
            <Tooltip
              content={<ChartTooltip prefix="$" />}
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="Rooms"
              stroke={COLORS.sky}
              strokeWidth={2.5}
              fill="url(#gRooms)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#0a1020' }}
            />
            <Area
              type="monotone"
              dataKey="Food"
              stroke="url(#sFood)"
              strokeWidth={3}
              fill="url(#gFood)"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#0a1020' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable glowing donut                                             */
/* ------------------------------------------------------------------ */
export type DonutSlice = {
  name: string;
  value: number;
  color: string;
};

export function GlowDonut({
  data,
  centerValue,
  centerLabel,
  idPrefix,
  height = 150,
  prefix = '',
}: {
  data: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  idPrefix: string;
  height?: number;
  prefix?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;
  const chartData: DonutSlice[] = hasData ? data.filter((d) => d.value > 0) : [{ name: 'Empty', value: 1, color: '#1e293b' }];

  return (
    <>
      <div
        className="relative w-full [&_.recharts-sector]:[filter:drop-shadow(0_0_10px_rgba(255,255,255,0.18))]"
        style={{ height }}
      >
        <ResponsiveContainer>
          <PieChart>
            <defs>
              {chartData.map((d, i) => (
                <linearGradient key={i} id={`${idPrefix}-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={d.color} />
                  <stop offset="100%" stopColor={d.color} stopOpacity={0.45} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={hasData && chartData.length > 1 ? 5 : 0}
              cornerRadius={10}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={hasData ? `url(#${idPrefix}-${i})` : d.color} />
              ))}
            </Pie>
            {hasData && <Tooltip content={<ChartTooltip prefix={prefix} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{centerValue}</p>
          <p className="text-[11px] tracking-wide text-slate-500">{centerLabel}</p>
        </div>
      </div>

      <ul className="mt-2 space-y-1">
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={d.name} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color, boxShadow: `0 0 10px ${d.color}` }} />
              <span className="text-slate-300">{d.name}</span>
              <span className="ml-auto font-semibold text-white">
                {prefix}
                {prefix === '$' ? d.value.toFixed(2) : d.value}
              </span>
              <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue split                                                      */
/* ------------------------------------------------------------------ */
export function RevenueSplitDonut({ food, rooms }: { food: number; rooms: number }) {
  return (
    <GlassCard title="Revenue Split" subtitle="Food vs Rooms" icon={PieIcon} accent={COLORS.violet} className="h-full">
      <GlowDonut
        idPrefix="split"
        prefix="$"
        centerValue={`$${(food + rooms).toFixed(0)}`}
        centerLabel="Combined"
        data={[
          { name: 'Food', value: Math.round(food * 100) / 100, color: COLORS.emerald },
          { name: 'Rooms', value: Math.round(rooms * 100) / 100, color: COLORS.sky },
        ]}
      />
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Reservation status                                                 */
/* ------------------------------------------------------------------ */
const RES_COLORS: Record<string, string> = {
  pending: COLORS.amber,
  confirmed: COLORS.emerald,
  checked_in: COLORS.sky,
  completed: COLORS.slate,
  cancelled: COLORS.rose,
  no_show: COLORS.orange,
};

export function ReservationStatusDonut({
  data,
  total,
}: {
  data: { name: string; value: number; key: string }[];
  total: number;
}) {
  return (
    <GlassCard
      title="Reservation Status"
      subtitle="Where every room booking stands"
      icon={CalendarCheck}
      accent={COLORS.sky}
      className="h-full"
    >
      {!data.length ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-300 shadow-[0_0_30px_-6px_#38bdf8]">
            <BedDouble size={24} />
          </span>
          <p className="text-sm text-slate-400">No reservations in this period.</p>
          <p className="text-xs text-slate-600">New bookings will show up here.</p>
        </div>
      ) : (
        <GlowDonut
          idPrefix="res"
          centerValue={String(total)}
          centerLabel="Total"
          data={data.map((d) => ({ name: d.name, value: d.value, color: RES_COLORS[d.key] ?? '#64748b' }))}
        />
      )}
    </GlassCard>
  );
}

