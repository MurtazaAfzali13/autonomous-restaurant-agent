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
import {
  BusyHoursChart,
  CategoryDonut,
  OrderStatusDonut,
  RatingsCard,
  TopSellers,
  type RatingSummary,
  type TopSeller,
} from './components/InsightCharts';
import RecentActivity from './components/RecentActivity';
import MealsChart from './components/MealsChart';
import { useMeals } from '../menu/hooks/useMeal';

export default function DashboardPage() {
  const { meals, category, loading: mealsLoading } = useMeals();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [ratings, setRatings] = useState<RatingSummary | null>(null);
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
      fetch('/api/admin/analytics').then((r) => r.json()).catch(() => null),
    ])
      .then(([orderData, reservationData, analytics]) => {
        if (orderData.success) setOrders(orderData.orders || []);
        setReservations(Array.isArray(reservationData) ? reservationData : []);
        if (analytics?.success) {
          setTopSellers(analytics.topSellers || []);
          setRatings(analytics.ratings || null);
        }
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-300">
        <div className="relative mb-5 h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-400" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-400/20 blur-md" />
        </div>
        <p className="text-sm tracking-widest text-emerald-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ambient neon glow behind everything */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="absolute right-0 top-40 h-[320px] w-[320px] rounded-full bg-sky-500/15 blur-[110px]" />
        <div className="absolute bottom-20 left-1/3 h-[360px] w-[360px] rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <header className="mb-3">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 shadow-[0_0_24px_-6px_#34d399]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Manager Dashboard
          </div>
          <h1 className="bg-gradient-to-r from-white via-emerald-100 to-sky-300 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
            Restaurant &amp; Rooms Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back — here&apos;s what&apos;s happening across food orders and room reservations.
          </p>
        </header>

        <DateRangeTabs value={range} onChange={setRange} />

        <StatCards orders={filteredOrders} reservations={filteredReservations} trendData={trendData} />

        {/* Row A: revenue trend + split */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <RevenueTrendChart data={trendData} />
          </div>
          <RevenueSplitDonut food={foodRevenue} rooms={roomRevenue} />
        </div>

        {/* Row B: meals + reservation status + order status */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <MealsChart meals={meals} category={category} loading={mealsLoading} />
          </div>
          <ReservationStatusDonut data={resStatusData} total={filteredReservations.length} />
          <OrderStatusDonut orders={filteredOrders} />
        </div>

        {/* Row C: busy times + categories + ratings */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <BusyHoursChart orders={filteredOrders} />
          </div>
          <CategoryDonut meals={meals} />
          <RatingsCard ratings={ratings} />
        </div>

        {/* Row D: top sellers + recent activity */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <TopSellers items={topSellers} />
          </div>
          <div className="xl:col-span-2">
            <RecentActivity orders={filteredOrders} reservations={filteredReservations} />
          </div>
        </div>
      </div>
    </div>
  );
}
