'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MapPin } from 'lucide-react';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { normalizeOrderStatus } from '@/lib/order-types';

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: number;
  customer_name: string;
  total_price: number;
  created_at: string;
  status?: string;
}

function GlowingButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const primary =
    'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]';
  const secondary =
    'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)]';

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden flex-1 text-center py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base transition-all duration-500 active:scale-[0.98] ${
        variant === 'primary' ? primary : secondary
      }`}
    >
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/order/${orderId}`);
        const data = await res.json();

        if (data.success) {
          setOrder(data.order);
          setItems(data.items ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center text-slate-200">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm">Loading order...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center max-w-md">
          <p className="text-rose-400 font-semibold mb-4">Order not found</p>
          <GlowingButton href="/menu" variant="primary">
            Back to Menu
          </GlowingButton>
        </div>
      </section>
    );
  }

  const orderStatus = normalizeOrderStatus(order.status);

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(16,185,129,0.12)] hover:shadow-[0_0_60px_rgba(16,185,129,0.18)] transition-shadow duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-6 animate-bounce">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl scale-150" />
              <CheckCircle2 className="relative w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Order Confirmed
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Thank you, {order.customer_name.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Order <span className="text-emerald-400 font-bold">#{order.id}</span> is in our kitchen queue.
          </p>
        </div>

        <div className="mb-8 px-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">
            Live status
          </p>
          <OrderStatusTimeline status={orderStatus} />
        </div>

        <ul className="space-y-2 text-sm border-t border-slate-800 pt-5 mb-5">
          {items.map((item, idx) => (
            <li key={idx} className="flex justify-between text-slate-300">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-center border-t border-slate-800 pt-4 mb-8">
          <span className="font-semibold text-slate-300">Total paid</span>
          <span className="text-2xl font-black text-emerald-400">${Number(order.total_price).toFixed(2)}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <GlowingButton href="/myOrders" variant="primary">
            <span className="inline-flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              Track My Order
            </span>
          </GlowingButton>
          <GlowingButton href="/menu" variant="secondary">
            Back to Menu
          </GlowingButton>
        </div>
      </div>
    </section>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-emerald-400 text-sm tracking-widest uppercase">
          Loading...
        </section>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
