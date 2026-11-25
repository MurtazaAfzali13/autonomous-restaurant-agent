// app/dashboard/components/StatCards.tsx
'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Bell, BedDouble, DollarSign, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { COLORS, money, useCountUp } from './ui';

interface Props {
  orders: any[];
  reservations: any[];
  trendData: { date: string; Food: number; Rooms: number }[];
}

function Spark({ data, dataKey, color, id }: { data: any[]; dataKey: string; color: string; id: string }) {
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  color: string;
  sub: string;
  spark?: { data: any[]; key: string };
  pulse?: boolean;
}

function KpiCard({ label, value, format, icon: Icon, color, sub, spark, pulse }: CardProps) {
  const animated = useCountUp(value);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
      style={{
        borderColor: `${color}33`,
        background: `linear-gradient(145deg, ${color}1f 0%, rgba(8,12,28,0.85) 55%, rgba(5,8,22,0.95) 100%)`,
        boxShadow: `0 0 0 1px ${color}10, 0 18px 50px -24px ${color}99`,
      }}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: color }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-300">{label}</p>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.25)]">
            {format(animated)}
          </p>
        </div>
        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ color, borderColor: `${color}55`, background: `${color}1a`, boxShadow: `0 0 22px -4px ${color}` }}
        >
          {pulse && value > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: color }} />
              <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: color }} />
            </span>
          )}
          <Icon size={17} />
        </span>
      </div>
      <p className="relative mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>
      {spark && (
        <div className="relative -mx-1 mt-1.5">
          <Spark data={spark.data} dataKey={spark.key} color={color} id={`spark-${label.replace(/\s/g, '')}`} />
        </div>
      )}
    </div>
  );
}

export default function StatCards({ orders, reservations, trendData }: Props) {
  const foodRev = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
  const activeRes = reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'no_show');
  const roomRev = activeRes.reduce((s, r) => s + Number(r.total_price || 0), 0);
  const nights = activeRes.reduce((s, r) => s + Number(r.nights || 0), 0);
  const pendingOrders = orders.filter((o) => String(o.status).toLowerCase() === 'pending').length;
  const pendingRes = reservations.filter((r) => r.status === 'pending').length;
  const avgOrder = orders.length ? foodRev / orders.length : 0;
  const series = trendData.map((d) => ({ ...d, Total: d.Food + d.Rooms }));

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <KpiCard
        label="Total Revenue"
        value={foodRev + roomRev}
        format={money}
        icon={DollarSign}
        color={COLORS.emerald}
        sub={`Avg order ${money(avgOrder)}`}
        spark={{ data: series, key: 'Total' }}
      />
      <KpiCard
        label="Food Orders"
        value={orders.length}
        format={(n) => Math.round(n).toString()}
        icon={UtensilsCrossed}
        color={COLORS.amber}
        sub={`${money(foodRev)} from the kitchen`}
        spark={{ data: series, key: 'Food' }}
      />
      <KpiCard
        label="Room Reservations"
        value={reservations.length}
        format={(n) => Math.round(n).toString()}
        icon={BedDouble}
        color={COLORS.sky}
        sub={`${nights} nights · ${money(roomRev)}`}
        spark={{ data: series, key: 'Rooms' }}
      />
      <KpiCard
        label="Needs Attention"
        value={pendingOrders + pendingRes}
        format={(n) => Math.round(n).toString()}
        icon={Bell}
        color={COLORS.rose}
        sub={`${pendingOrders} pending orders · ${pendingRes} pending bookings`}
        pulse
      />
    </div>
  );
}
