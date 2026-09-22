'use client';

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import OrderStatsWidgets from "../components/OrderStatsWidgets";
import { isOrderCompleted, OrderRow } from "@/lib/order-types";
import { normalizeOrderStatus } from "@/lib/order-types";
import { ChefHat, CheckCircle2, Mail, Trash2, User } from "lucide-react";

const FADE_OUT_MS = 450;

const AdminOrdersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(() => new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "admin") {
      router.push("/403");
      return;
    }

    fetchOrders();
  }, [session, status, router, fetchOrders]);

  const updateStatus = async (orderId: number, nextStatus: "cooking" | "delivered") => {
    setUpdatingId(orderId);
    setStatusError(null);
    try {
      const res = await fetch(`/api/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusError(data.error || "Could not update order status.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: data.order.status } : o
        )
      );
    } catch (err) {
      console.error(err);
      setStatusError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!deleteTarget) return;
    const orderId = deleteTarget.id;
    setDeletingId(orderId);
    setStatusError(null);

    try {
      const res = await fetch(`/api/order/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusError(data.error || "Could not delete order.");
        return;
      }

      setDeleteTarget(null);
      setRemovingIds((prev) => new Set(prev).add(orderId));

      window.setTimeout(() => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }, FADE_OUT_MS);
    } catch (err) {
      console.error(err);
      setStatusError("Network error while deleting order.");
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 text-sm tracking-widest uppercase">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Admin Control
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          All Orders
        </h1>
        <p className="text-slate-400 mt-2">Manage every customer order and update kitchen status.</p>
      </header>

      <OrderStatsWidgets orders={orders} />

      {statusError && (
        <p className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
          {statusError}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No orders have been placed yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusNorm = normalizeOrderStatus(order.status);
            const isUpdating = updatingId === order.id;
            const isRemoving = removingIds.has(order.id);
            const canDelete = isOrderCompleted(order.status);

            return (
              <article
                key={order.id}
                className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-500 ease-out ${
                  isRemoving
                    ? "opacity-0 scale-[0.98] -translate-y-2 max-h-0 !py-0 !my-0 pointer-events-none border-transparent"
                    : "opacity-100 scale-100"
                }`}
              >
                <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Order #{order.id}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="px-5 sm:px-6 py-4 grid sm:grid-cols-2 gap-3 text-sm border-b border-slate-800/80">
                  <p className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-emerald-400" />
                    {order.customer_name}
                  </p>
                  <p className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {order.customer_email || "—"}
                  </p>
                </div>

                <div className="px-5 sm:px-6 py-5 border-b border-slate-800/80">
                  <OrderStatusTimeline status={order.status} compact />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 uppercase text-xs tracking-wider border-b border-slate-800">
                        <th className="px-5 sm:px-6 py-3 font-bold">Item</th>
                        <th className="px-4 py-3 font-bold">Qty</th>
                        <th className="px-4 py-3 font-bold text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items ?? []).map((item, index) => (
                        <tr key={`${order.id}-${index}`} className="border-b border-slate-800/50 text-slate-300">
                          <td className="px-5 sm:px-6 py-3">{item.title}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-emerald-400/90">${item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/30">
                  <p className="text-xl font-black text-emerald-400">
                    Total: ${Number(order.total_price).toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusNorm === "pending" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(order.id, "cooking")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-sm font-bold hover:bg-cyan-500/25 shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all duration-300 disabled:opacity-50"
                      >
                        <ChefHat className="w-4 h-4" />
                        Mark as Cooking
                      </button>
                    )}
                    {(statusNorm === "pending" || statusNorm === "cooking") && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(order.id, "delivered")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-300 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === order.id || isRemoving}
                        onClick={() => setDeleteTarget(order)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 backdrop-blur-md border border-rose-500/30 text-rose-400 text-sm font-bold hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-order-title"
        >
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(244,63,94,0.15)]">
            <h2 id="delete-order-title" className="text-xl font-bold text-white mb-3">
              Delete completed order?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Are you sure you want to delete this completed order? This action cannot be undone.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Order #{deleteTarget.id} · ${Number(deleteTarget.total_price).toFixed(2)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="flex-1 py-3 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-200 font-semibold hover:bg-slate-700 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={deletingId !== null}
                className="group relative flex-1 overflow-hidden py-3 rounded-2xl border border-rose-500/40 bg-rose-500/20 text-rose-200 font-bold hover:bg-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all duration-300 disabled:opacity-50"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                <span className="relative z-10">
                  {deletingId === deleteTarget.id ? "Deleting..." : "Yes, Delete Order"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
