// app/admin/reservations/page.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Calendar, Users, DollarSign, BedDouble } from 'lucide-react'
import {
  STATUS_META,
  normalizeReservationStatus,
  adminCanCheckIn,
  adminCanMarkNoShow,
  type ReservationStatus,
} from '@/lib/reservation-status'

const FILTERS = ['all', ...Object.keys(STATUS_META)] as (ReservationStatus | 'all')[]

export default function AdminReservationsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all')

  const load = () =>
    fetch('/api/reservations')
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  async function setStatus(id: number, status: ReservationStatus) {
    setBusyId(id)
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusyId(null)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(body.error || 'Could not update reservation')
    }
    load()
  }

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => normalizeReservationStatus(r.status) === filter)),
    [rows, filter]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length }
    for (const r of rows) {
      const s = normalizeReservationStatus(r.status)
      c[s] = (c[s] ?? 0) + 1
    }
    return c
  }, [rows])

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center text-slate-200">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm">
          Loading reservations…
        </p>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Admin
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2">
            Room Reservations
          </h1>
          <p className="text-slate-400">Review, confirm, check in, and track every room booking.</p>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition
                ${
                  filter === f
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
            >
              {f === 'all' ? 'All' : STATUS_META[f].label} {counts[f] ? <span className="opacity-70">· {counts[f]}</span> : null}
            </button>
          ))}
        </div>

        {!filtered.length ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-16 text-center">
            <BedDouble className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-70" />
            <p className="text-slate-400">No reservations in this filter.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {filtered.map((r) => {
              const status = normalizeReservationStatus(r.status)
              const meta = STATUS_META[status]
              const busy = busyId === r.id

              return (
                <li
                  key={r.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur
                             transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40
                             hover:shadow-[0_24px_60px_-24px_rgba(16,185,129,0.35)]"
                >
                  <div className="flex">
                    <div className="relative w-36 sm:w-44 shrink-0 overflow-hidden">
                      <Image
                        src={r.rooms.image}
                        alt={r.rooms.name}
                        fill
                        sizes="180px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/70" />
                    </div>

                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Reservation #{r.id}
                          </p>
                          <h2 className="text-lg font-bold text-white leading-tight">{r.rooms.name}</h2>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {r.users.firstname} {r.users.lastname}
                          </p>
                        </div>
                        <span
                          title={meta.description}
                          className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm text-slate-300">
                        <p className="flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-400 shrink-0" />
                          {r.check_in} <span className="text-slate-600">→</span> {r.check_out}
                          <span className="text-slate-500">· {r.nights} nights</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Users size={14} className="text-emerald-400 shrink-0" />
                          {r.adults + r.children} guest{r.adults + r.children > 1 ? 's' : ''}
                        </p>
                        <p className="flex items-center gap-2 font-bold text-emerald-400">
                          <DollarSign size={14} className="shrink-0" />
                          {Number(r.total_price).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 flex flex-wrap gap-2">
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => setStatus(r.id, 'confirmed')}
                              disabled={busy}
                              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-50"
                            >
                              {busy ? '…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setStatus(r.id, 'cancelled')}
                              disabled={busy}
                              className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => setStatus(r.id, 'checked_in')}
                              disabled={busy || !adminCanCheckIn(status, r.check_in)}
                              title={
                                adminCanCheckIn(status, r.check_in)
                                  ? ''
                                  : `Available on ${r.check_in}`
                              }
                              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {busy ? '…' : 'Check in'}
                            </button>
                            <button
                              onClick={() => setStatus(r.id, 'no_show')}
                              disabled={busy || !adminCanMarkNoShow(status, r.check_in)}
                              title={
                                adminCanMarkNoShow(status, r.check_in)
                                  ? ''
                                  : `Available after ${r.check_in}`
                              }
                              className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              No-show
                            </button>
                            <button
                              onClick={() => setStatus(r.id, 'cancelled')}
                              disabled={busy}
                              className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {status === 'checked_in' && (
                          <button
                            onClick={() => setStatus(r.id, 'completed')}
                            disabled={busy}
                            className="rounded-full border border-slate-500/30 bg-slate-500/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-500/20 active:scale-95 disabled:opacity-50"
                          >
                            {busy ? '…' : 'Mark completed'}
                          </button>
                        )}

                        {(status === 'completed' || status === 'cancelled' || status === 'no_show') && (
                          <p className="text-xs text-slate-600 py-2">No actions available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
