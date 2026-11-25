"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, ArrowRight, Download, Inbox, LayoutGrid, Printer, RefreshCw, Search, Table2, X, XCircle,
} from "lucide-react";
import { GlassCard, ChartTooltip, GRID, TICK, money, useCountUp } from "../components/ui";
import DateRangeTabs from "../components/DateRangeTabs"; 
import { filterByRange, RangeKey } from "@/lib/dashboard-stats"; 
import {
  FLOW, ORDER_STATUSES, OrderStatus, STATUS_META, nextStatus, toStatus,
} from "@/lib/order-status";

type Item = { id: number; meal_id: number; quantity: number; price: number; meals: { id: number; title: string; image: string | null } | null };
type Order = {
  id: number; customer_name: string; customer_email: string | null;
  total_price: number; created_at: string; status: OrderStatus; items: Item[];
};
type Toast = { id: number; msg: string };

const PAGE = 20;
const REFRESH_MS = 30_000;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ago = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};
const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";

/** Parses JSON safely: an empty or non-JSON body becomes a readable error instead of a crash. */
async function readJson(res: Response): Promise<{ success?: boolean; error?: string; [k: string]: unknown }> {
  const text = await res.text();
  if (!text) return { success: false, error: `Empty response from server (HTTP ${res.status}).` };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: `Server returned non-JSON (HTTP ${res.status}).` };
  }
}

function normalize(raw: Record<string, unknown>): Order {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any; // isolated: Supabase nested select typing
  return {
    id: r.id, customer_name: r.customer_name, customer_email: r.customer_email ?? null,
    total_price: Number(r.total_price), created_at: r.created_at, status: toStatus(r.status),
    items: (r.order_items ?? r.items ?? []).map((i: Item & { title?: string }) => ({
      ...i, price: Number(i.price), meals: i.meals ?? (i.title ? { id: i.meal_id, title: i.title, image: null } : null),
    })),
  };
}

/* ---------- small components ---------- */
function Pill({ status }: { status: OrderStatus }) {
  const { label, color } = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, borderColor: `${color}55`, background: `${color}1f` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{label}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none ${className}`} />;
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 80},${22 - (v / max) * 20}`).join(" ");
  return (
    <svg width="80" height="24" aria-hidden className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

function Kpi({ label, value, fmt, color, spark, pulse }: {
  label: string; value: number; fmt?: (n: number) => string; color: string; spark: number[]; pulse?: boolean;
}) {
  const n = useCountUp(value);
  return (
    <GlassCard title={label}>
      <div className="flex items-end justify-between gap-2">
        <p className="flex items-center gap-2 text-2xl font-bold text-white">
          {pulse && <span className="h-2 w-2 animate-pulse rounded-full motion-reduce:animate-none" style={{ background: color }} />}
          {fmt ? fmt(n) : Math.round(n)}
        </p>
        <Spark data={spark} color={color} />
      </div>
    </GlassCard>
  );
}

function ThumbStack({ items }: { items: Item[] }) {
  return (
    <div className="flex items-center">
      {items.slice(0, 3).map((it, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={it.id ?? i} src={it.meals?.image ?? ""} alt={it.meals?.title ?? "Dish"} title={it.meals?.title}
          className="-ml-2 h-6 w-6 rounded-full border border-slate-900 bg-slate-800 object-cover first:ml-0" />
      ))}
      {items.length > 3 && <span className="ml-1.5 text-[11px] text-slate-400">+{items.length - 3}</span>}
    </div>
  );
}

/* ---------- page ---------- */
export default function OrdersPage() {
  const { data: session, status: auth } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<RangeKey>("30d" as RangeKey);
  const [chip, setChip] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "total">("newest");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<number> | null>(null);

  const toast = (msg: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load orders.");
      const list: Order[] = ((data.orders as Record<string, unknown>[] | undefined) ?? []).map(normalize);
      if (seen.current) {
        const added = list.filter((o) => !seen.current!.has(o.id)).map((o) => o.id);
        if (added.length) {
          setFresh(new Set(added));
          window.setTimeout(() => setFresh(new Set()), 6000);
        }
      }
      seen.current = new Set(list.map((o) => o.id));
      setOrders(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (auth === "loading") return;
    if (!session || session.user.role !== "admin") { router.push("/403"); return; }
    load();
    const t = window.setInterval(() => load(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [auth, session, router, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (cancelTarget) setCancelTarget(null); else setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelTarget]);

  const setStatus = async (order: Order, to: OrderStatus) => {
    if (busy.has(order.id)) return;
    const prev = order.status;
    setBusy((b) => new Set(b).add(order.id));
    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: to } : o)));
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || "Could not update status.");
    } catch (e) {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: prev } : o)));
      toast(e instanceof Error ? e.message : "Network error while updating status.");
    } finally {
      setBusy((b) => { const n = new Set(b); n.delete(order.id); return n; });
    }
  };

  /* derived data */
  const ranged = useMemo(() => filterByRange(orders, range) as Order[], [orders, range]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    ranged.forEach((o) => c[o.status]++);
    return c;
  }, [ranged]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = ranged.filter((o) => {
      if (chip !== "all" && o.status !== chip) return false;
      if (!t) return true;
      return (
        String(o.id).includes(t.replace("#", "")) || o.customer_name?.toLowerCase().includes(t) ||
        o.customer_email?.toLowerCase().includes(t) || o.items.some((i) => i.meals?.title.toLowerCase().includes(t))
      );
    });
    return [...list].sort((a, b) =>
      sort === "total" ? b.total_price - a.total_price
        : (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * (sort === "oldest" ? 1 : -1));
  }, [ranged, chip, q, sort]);

  useEffect(() => setShown(PAGE), [chip, q, sort, range]);

  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(Date.now() - (6 - i) * 864e5).toISOString()));
    const by = (f: (o: Order) => number) => days.map((d) => ranged.filter((o) => dayKey(o.created_at) === d).reduce((s, o) => s + f(o), 0));
    return {
      count: by(() => 1),
      rev: by((o) => (o.status === "cancelled" ? 0 : o.total_price)),
      attn: by((o) => (o.status === "pending" || o.status === "cooking" ? 1 : 0)),
    };
  }, [ranged]);

  const revenue = ranged.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_price, 0);
  const valid = ranged.length - counts.cancelled;
  const perDay = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((o) => m.set(dayKey(o.created_at), (m.get(dayKey(o.created_at)) ?? 0) + 1));
    return [...m.entries()].sort().map(([d, orders]) => ({ d: d.slice(5), orders }));
  }, [filtered]);
  const donut = ORDER_STATUSES.map((s) => ({ name: STATUS_META[s].label, value: filtered.filter((o) => o.status === s).length, color: STATUS_META[s].color })).filter((x) => x.value > 0);
  const topDishes = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((o) => o.items.forEach((i) => m.set(i.meals?.title ?? "Unknown", (m.get(i.meals?.title ?? "Unknown") ?? 0) + i.quantity)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [["Order", "Customer", "Email", "Items", "Total", "Status", "Created"],
      ...filtered.map((o) => [o.id, o.customer_name, o.customer_email ?? "",
        o.items.map((i) => `${i.quantity}x ${i.meals?.title ?? ""}`).join("; "), o.total_price.toFixed(2), o.status, fmtDate(o.created_at)])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const open = orders.find((o) => o.id === openId) ?? null;

  /* actions cell shared by table + kanban */
  const Actions = ({ o }: { o: Order }) => {
    const nx = nextStatus(o.status);
    const dis = busy.has(o.id);
    return (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {nx && (
          <button type="button" disabled={dis} aria-label={`Move order ${o.id} to ${STATUS_META[nx].label}`}
            onClick={() => setStatus(o, nx)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold disabled:opacity-50 ${focus}`}
            style={{ color: STATUS_META[nx].color, borderColor: `${STATUS_META[nx].color}55`, background: `${STATUS_META[nx].color}14` }}>
            {STATUS_META[nx].label}<ArrowRight className="h-3 w-3" />
          </button>
        )}
        {(o.status === "pending" || o.status === "cooking") && (
          <button type="button" disabled={dis} aria-label={`Cancel order ${o.id}`} onClick={() => setCancelTarget(o)}
            className={`rounded-lg border border-rose-400/30 p-1 text-rose-300 hover:bg-rose-400/10 disabled:opacity-50 ${focus}`}>
            <XCircle className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  if (auth === "loading") return null;

  return (
    <div className="relative pt-2 sm:pt-12">
      <style>{`@media print{body *{visibility:hidden}#receipt,#receipt *{visibility:visible}#receipt{position:absolute;inset:0;padding:24px;background:#fff;color:#000}#receipt .no-print{display:none}}
        @keyframes flashrow{from{background:rgba(251,191,36,.28)}to{background:transparent}}
        @media (prefers-reduced-motion:no-preference){.flash{animation:flashrow 3s ease-out}}`}</style>
      <div aria-hidden className="pointer-events-none absolute -top-10 left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-40 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative space-y-3">
        {/* header */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />Live orders
            </span>
            <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">Orders</h1>
            <p className="text-sm text-slate-400">Track every order from the kitchen to the door.</p>
          </div>
          <DateRangeTabs value={range} onChange={setRange} />
        </header>

        {error && !loading && (
          <GlassCard title="Could not load orders">
            <div className="flex items-center justify-between gap-3 text-sm text-rose-300">
              <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span>
              <button type="button" onClick={() => load(true)} className={`rounded-lg border border-rose-400/40 px-3 py-1 ${focus}`}>Try again</button>
            </div>
          </GlassCard>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px]" />) : (<>
            <Kpi label="Total orders" value={ranged.length} color="#38bdf8" spark={last7.count} />
            <Kpi label="Revenue" value={revenue} fmt={money} color="#10b981" spark={last7.rev} />
            <Kpi label="Average order" value={valid ? revenue / valid : 0} fmt={money} color="#a78bfa" spark={last7.rev} />
            <Kpi label="Needs attention" value={counts.pending + counts.cooking} color="#fb923c" spark={last7.attn} pulse />
          </>)}
        </div>

        {/* pipeline */}
        <GlassCard title="Status pipeline">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {(["all", ...ORDER_STATUSES] as const).map((s) => {
              const color = s === "all" ? "#94a3b8" : STATUS_META[s].color;
              const n = s === "all" ? ranged.length : counts[s];
              const on = chip === s;
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setChip(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${focus}`}
                  style={{ color, borderColor: `${color}${on ? "aa" : "40"}`, background: `${color}${on ? "26" : "0f"}`, boxShadow: on ? `0 0 14px ${color}55` : "none" }}>
                  {s === "all" ? "All" : STATUS_META[s].label} <span className="ml-1 opacity-80">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
            {ORDER_STATUSES.map((s) => (
              <div key={s} style={{ width: `${ranged.length ? (counts[s] / ranged.length) * 100 : 0}%`, background: STATUS_META[s].color }} />
            ))}
          </div>
        </GlassCard>

        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search id, customer, email, dish"
              className={`w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-500 ${focus}`} />
          </label>
          <select aria-label="Sort orders" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            className={`rounded-xl border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 ${focus}`}>
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="total">Highest total</option>
          </select>
          <div className="flex overflow-hidden rounded-xl border border-white/10" role="group" aria-label="View">
            {([["table", Table2, "Table"], ["kanban", LayoutGrid, "Kanban"]] as const).map(([k, Icon, l]) => (
              <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs ${view === k ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400"} ${focus}`}>
                <Icon className="h-3.5 w-3.5" />{l}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Refresh orders" onClick={() => load(true)}
            className={`rounded-xl border border-white/10 p-2 text-slate-300 ${focus}`}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
          </button>
          <button type="button" onClick={exportCsv} disabled={!filtered.length}
            className={`flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-300 disabled:opacity-40 ${focus}`}>
            <Download className="h-3.5 w-3.5" />Export CSV
          </button>
        </div>

        {/* main */}
        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <GlassCard title="Orders">
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-400">{orders.length ? "No orders match these filters. Try a wider date range or clear the search." : "No orders yet. New orders appear here within 30 seconds."}</p>
            </div>
          </GlassCard>
        ) : view === "table" ? (
          <GlassCard title={`Orders (${filtered.length})`}>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-950/90 text-slate-500 backdrop-blur">
                  <tr>{["Order #", "Customer", "Items", "Total", "Status", "Created", "Actions"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.slice(0, shown).map((o) => (
                    <tr key={o.id} tabIndex={0} onClick={() => setOpenId(o.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") setOpenId(o.id); }}
                      className={`cursor-pointer border-t border-white/5 text-slate-300 hover:bg-white/[0.04] ${focus} ${fresh.has(o.id) ? "flash" : ""}`}>
                      <td className="px-3 py-2 font-semibold text-white">#{o.id}{fresh.has(o.id) && <span className="ml-1.5 rounded bg-amber-400/20 px-1 text-[10px] text-amber-300">New</span>}</td>
                      <td className="px-3 py-2"><p>{o.customer_name}</p><p className="text-slate-500">{o.customer_email || "—"}</p></td>
                      <td className="px-3 py-2"><ThumbStack items={o.items} /></td>
                      <td className="px-3 py-2 font-semibold text-emerald-300">{money(o.total_price)}</td>
                      <td className="px-3 py-2"><Pill status={o.status} /></td>
                      <td className="px-3 py-2 text-slate-400" title={fmtDate(o.created_at)}>{ago(o.created_at)}</td>
                      <td className="px-3 py-2"><Actions o={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shown < filtered.length && (
              <button type="button" onClick={() => setShown((n) => n + PAGE)}
                className={`mt-3 w-full rounded-xl border border-white/10 py-1.5 text-xs text-slate-300 hover:bg-white/5 ${focus}`}>
                Load more ({filtered.length - shown} left)
              </button>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {FLOW.map((s) => {
              const col = filtered.filter((o) => o.status === s);
              return (
                <GlassCard key={s} title={`${STATUS_META[s].label} (${col.length})`}>
                  <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                    {col.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Nothing here</p>}
                    {col.map((o) => (
                      <div key={o.id} role="button" tabIndex={0} onClick={() => setOpenId(o.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") setOpenId(o.id); }}
                        className={`cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs hover:border-white/20 ${focus} ${fresh.has(o.id) ? "flash" : ""}`}>
                        <div className="flex justify-between"><span className="font-semibold text-white">#{o.id}</span><span className="text-emerald-300">{money(o.total_price)}</span></div>
                        <p className="mt-0.5 text-slate-300">{o.customer_name}</p>
                        <p className="text-slate-500">{o.items.reduce((n, i) => n + i.quantity, 0)} items · {ago(o.created_at)}</p>
                        <div className="mt-2"><Actions o={o} /></div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* insights */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <GlassCard title="Orders per day">
              <div className="h-40"><ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perDay}>
                  <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="d" tick={{ fill: TICK, fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: TICK, fontSize: 11 }} width={24} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#og)" style={{ filter: "drop-shadow(0 0 4px #10b981)" }} />
                </AreaChart>
              </ResponsiveContainer></div>
            </GlassCard>
            <GlassCard title="Orders by status">
              <div className="flex h-40 items-center gap-3">
                <div className="h-full flex-1"><ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={donut} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} stroke="none">
                    {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie><Tooltip content={<ChartTooltip />} /></PieChart>
                </ResponsiveContainer></div>
                <ul className="space-y-1 text-xs text-slate-300">{donut.map((d) => <li key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name} {d.value}</li>)}</ul>
              </div>
            </GlassCard>
            <GlassCard title="Top dishes">
              <ul className="space-y-2">
                {topDishes.map(([name, n]) => (
                  <li key={name} className="text-xs text-slate-300">
                    <div className="mb-1 flex justify-between"><span className="truncate">{name}</span><span className="text-slate-500">{n}</span></div>
                    <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-400" style={{ width: `${(n / topDishes[0][1]) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}
      </div>

      {/* drawer */}
      <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpenId(null)} className={`absolute inset-0 bg-black/60 transition-opacity motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`} />
        <aside role="dialog" aria-modal="true" aria-label="Order details"
          className={`absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-white/10 bg-slate-950 p-5 transition-transform duration-300 motion-reduce:transition-none sm:w-[420px] ${open ? "translate-x-0" : "translate-x-full"}`}>
          {open && (
            <div id="receipt" className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start justify-between">
                <div><h2 className="text-lg font-bold text-white">Order #{open.id}</h2><div className="mt-1"><Pill status={open.status} /></div></div>
                <button type="button" aria-label="Close order details" onClick={() => setOpenId(null)} className={`no-print rounded-lg p-1.5 text-slate-400 hover:bg-white/5 ${focus}`}><X className="h-4 w-4" /></button>
              </div>
              <div className="text-xs"><p className="text-white">{open.customer_name}</p><p className="text-slate-500">{open.customer_email || "—"}</p><p className="mt-1 text-slate-500">{fmtDate(open.created_at)}</p></div>

              <ol className="flex items-center gap-1" aria-label="Status progress">
                {open.status === "cancelled" ? (
                  <li className="w-full rounded-lg border border-rose-400/40 bg-rose-400/10 py-1.5 text-center text-xs font-semibold text-rose-300">Cancelled</li>
                ) : FLOW.map((s, i) => {
                  const reached = i <= FLOW.indexOf(open.status); const c = STATUS_META[s].color;
                  return (
                    <li key={s} className="flex-1 text-center text-[11px]" aria-current={s === open.status ? "step" : undefined}>
                      <div className="mb-1 h-1.5 rounded-full" style={{ background: reached ? c : "rgba(255,255,255,.08)", boxShadow: reached ? `0 0 8px ${c}` : "none" }} />
                      <span style={{ color: reached ? c : "#64748b" }}>{STATUS_META[s].label}</span>
                    </li>
                  );
                })}
              </ol>

              <ul className="divide-y divide-white/5">
                {open.items.map((it, i) => (
                  <li key={it.id ?? i} className="flex items-center gap-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.meals?.image ?? ""} alt="" className="h-10 w-10 rounded-lg bg-slate-800 object-cover" />
                    <div className="flex-1"><p className="text-white">{it.meals?.title ?? "Unknown dish"}</p><p className="text-xs text-slate-500">{it.quantity} × {money(it.price)}</p></div>
                    <span className="text-emerald-300">{money(it.quantity * it.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white"><span>Total</span><span className="text-emerald-300">{money(open.total_price)}</span></div>

              <div className="no-print flex flex-wrap gap-2">
                {nextStatus(open.status) && (
                  <button type="button" disabled={busy.has(open.id)} onClick={() => setStatus(open, nextStatus(open.status)!)}
                    className={`flex-1 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-50 ${focus}`}>
                    Move to {STATUS_META[nextStatus(open.status)!].label}
                  </button>
                )}
                {(open.status === "pending" || open.status === "cooking") && (
                  <button type="button" disabled={busy.has(open.id)} onClick={() => setCancelTarget(open)}
                    className={`rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 disabled:opacity-50 ${focus}`}>Cancel order</button>
                )}
                <button type="button" onClick={() => window.print()} className={`flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-300 ${focus}`}>
                  <Printer className="h-3.5 w-3.5" />Print receipt
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* cancel confirm */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cancel-title"
          onClick={() => setCancelTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-rose-400/30 bg-slate-900 p-5">
            <h2 id="cancel-title" className="text-base font-bold text-white">Cancel order #{cancelTarget.id}?</h2>
            <p className="mt-2 text-sm text-slate-400">The order stays in your history as cancelled. You can&apos;t change it afterwards.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" autoFocus onClick={() => setCancelTarget(null)} className={`flex-1 rounded-xl border border-white/15 py-2 text-sm text-slate-200 ${focus}`}>Keep order</button>
              <button type="button" onClick={() => { const o = cancelTarget; setCancelTarget(null); setStatus(o, "cancelled"); }}
                className={`flex-1 rounded-xl border border-rose-400/40 bg-rose-400/15 py-2 text-sm font-semibold text-rose-200 ${focus}`}>Cancel order</button>
            </div>
          </div>
        </div>
      )}

      {/* toasts */}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-xl border border-rose-400/40 bg-slate-900 px-3 py-2 text-xs text-rose-200 shadow-lg">
            <AlertTriangle className="h-4 w-4" />{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
