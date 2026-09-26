// app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { OrderRow } from '@/lib/order-types';
import {
  buildDailySeries,
  filterByRange,
  reservationStatusCounts,
  type RangeKey,
} from '@/lib/dashboard-stats';
import DateRangeTabs from './components/DateRangeTabs';
import StatCards from './components/StatCards';
import { RevenueTrendChart, RevenueSplitDonut, ReservationStatusDonut } from './components/RevenueCharts';
import RecentActivity from './components/RecentActivity';
import MealsChart from './components/MealsChart';
import { useMeals } from '../menu/hooks/useMeal';

export default function DashboardPage() {
  const { meals, category, loading: mealsLoading } = useMeals();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [range, setRange] = useState<RangeKey>('30d');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/403');
      return;
    }

    Promise.all([
      fetch('/api/admin/orders').then((r) => r.json()),
      fetch('/api/reservations').then((r) => r.json()),
    ])
      .then(([orderData, reservationData]) => {
        if (orderData.success) setOrders(orderData.orders || []);
        setReservations(Array.isArray(reservationData) ? reservationData : []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [session, status, router]);

  const filteredOrders = useMemo(() => filterByRange(orders, range), [orders, range]);
  const filteredReservations = useMemo(() => filterByRange(reservations, range), [reservations, range]);
  const trendData = useMemo(
    () => buildDailySeries(filteredOrders, filteredReservations, range),
    [filteredOrders, filteredReservations, range]
  );
  const resStatusData = useMemo(() => reservationStatusCounts(filteredReservations), [filteredReservations]);

  const foodRevenue = filteredOrders.reduce((s, o) => s + Number(o.total_price), 0);
  const roomRevenue = filteredReservations
    .filter((r) => r.status !== 'cancelled' && r.status !== 'no_show')
    .reduce((s, r) => s + Number(r.total_price), 0);

  if (status === 'loading' || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 text-sm tracking-widest uppercase">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Manager Dashboard
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Restaurant &amp; Rooms Overview
        </h1>
        <p className="text-slate-400 mt-2">
          Welcome back — here&apos;s what&apos;s happening across food orders and room reservations.
        </p>
      </header>

      <DateRangeTabs value={range} onChange={setRange} />

      <StatCards orders={filteredOrders} reservations={filteredReservations} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <RevenueTrendChart data={trendData} />
        </div>
        <RevenueSplitDonut food={foodRevenue} rooms={roomRevenue} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-6">
          <MealsChart meals={meals} category={category} loading={mealsLoading} />
        </div>
        <ReservationStatusDonut data={resStatusData} total={filteredReservations.length} />
      </div>

      <RecentActivity orders={filteredOrders} reservations={filteredReservations} />
    </div>
  );
}
