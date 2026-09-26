// app/dashboard/components/RevenueCharts.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const GRID = '#1e293b';
const TICK = '#94a3b8';
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 12,
  color: '#f1f5f9',
};

export function RevenueTrendChart({
  data,
}: {
  data: { date: string; Food: number; Rooms: number }[];
}) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-full">
      <h2 className="text-lg font-bold text-white mb-1">Revenue Overview</h2>
      <p className="text-sm text-slate-500 mb-4">Food orders vs room reservations</p>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="date" tick={{ fill: TICK, fontSize: 12 }} />
            <YAxis tick={{ fill: TICK, fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: TICK, fontSize: 12 }} />
            <Line type="monotone" dataKey="Food" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Rooms" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const RES_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  checked_in: '#38bdf8',
  completed: '#94a3b8',
  cancelled: '#fb7185',
  no_show: '#f97316',
};

export function ReservationStatusDonut({
  data,
  total,
}: {
  data: { name: string; value: number; key: string }[];
  total: number;
}) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-full">
      <h2 className="text-lg font-bold text-white mb-1">Reservation Status</h2>
      <p className="text-sm text-slate-500 mb-4">Where every room booking stands</p>

      {!data.length ? (
        <p className="text-slate-500 text-sm py-10 text-center">No reservations yet.</p>
      ) : (
        <div className="relative" style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                {data.map((d) => (
                  <Cell key={d.key} fill={RES_COLORS[d.key] ?? '#64748b'} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-black text-white">{total}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RES_COLORS[d.key] ?? '#64748b' }} />
              {d.name}
            </span>
            <span className="text-slate-400">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RevenueSplitDonut({ food, rooms }: { food: number; rooms: number }) {
  const data = [
    { name: 'Food', value: Math.round(food * 100) / 100 },
    { name: 'Rooms', value: Math.round(rooms * 100) / 100 },
  ];
  const total = food + rooms;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-full">
      <h2 className="text-lg font-bold text-white mb-1">Revenue Split</h2>
      <p className="text-sm text-slate-500 mb-4">Food vs Rooms</p>
      <div className="relative" style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              <Cell fill="#10b981" />
              <Cell fill="#38bdf8" />
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-black text-white">${total.toFixed(0)}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Combined</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        <li className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Food
          </span>
          <span className="text-emerald-400 font-bold">${food.toFixed(2)}</span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            Rooms
          </span>
          <span className="text-sky-400 font-bold">${rooms.toFixed(2)}</span>
        </li>
      </ul>
    </div>
  );
}
