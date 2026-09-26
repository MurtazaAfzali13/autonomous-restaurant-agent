// app/reservations/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Calendar, Users, XCircle } from 'lucide-react'

const STEPS = ['pending', 'confirmed', 'completed']

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [r, setR] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = () => fetch(`/api/reservations/${id}`).then(res => res.json()).then(setR).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  async function cancel() {
    setBusy(true)
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setBusy(false); load()
  }

  if (loading) return <section className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-emerald-400">Loading…</section>
  if (!r) return <section className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-rose-400">Reservation not found</section>

  const stepIndex = STEPS.indexOf(r.status)
  const cancelled = r.status === 'cancelled'

  return (
    <section className="min-h-screen bg-[#0a0f1a] text-slate-200 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 sm:p-10 shadow-[0_0_50px_rgba(16,185,129,0.12)]">
        <div className="flex flex-col items-center text-center mb-8">
          {cancelled
            ? <XCircle className="w-16 h-16 text-rose-400" />
            : <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {cancelled ? 'Cancelled' : 'Reservation Confirmed'}
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-black text-white">{r.rooms.name}</h1>
          <p className="mt-2 text-sm text-slate-400">Reservation <span className="text-emerald-400 font-bold">#{r.id}</span></p>
        </div>

        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl mb-6">
          <Image src={r.rooms.image} alt={r.rooms.name} fill className="object-cover" />
        </div>

        {!cancelled && (
          <div className="flex justify-between mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`h-9 w-9 rounded-full grid place-items-center font-bold text-sm
                  ${i <= stepIndex ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                  {i + 1}
                </div>
                <span className={`mt-1 text-xs uppercase font-bold ${i <= stepIndex ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</span>
              </div>
            ))}
          </div>
        )}

        <ul className="space-y-3 text-sm border-t border-slate-800 pt-5 mb-5">
          <li className="flex justify-between text-slate-300"><span className="flex items-center gap-2"><Calendar size={14} /> Check-in</span><span>{r.check_in}</span></li>
          <li className="flex justify-between text-slate-300"><span className="flex items-center gap-2"><Calendar size={14} /> Check-out</span><span>{r.check_out}</span></li>
          <li className="flex justify-between text-slate-300"><span className="flex items-center gap-2"><Users size={14} /> Guests</span><span>{r.adults + r.children}</span></li>
          <li className="flex justify-between text-slate-300"><span>Nights</span><span>{r.nights}</span></li>
        </ul>

        <div className="flex justify-between items-center border-t border-slate-800 pt-4 mb-8">
          <span className="font-semibold text-slate-300">Total</span>
          <span className="text-2xl font-black text-emerald-400">${Number(r.total_price).toFixed(2)}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/reservations" className="flex-1 text-center py-3.5 rounded-2xl font-bold bg-slate-800/80 border border-emerald-500/30 text-emerald-400 hover:bg-slate-700">
            My Reservations
          </Link>
          {!cancelled && r.status === 'pending' && (
            <button onClick={cancel} disabled={busy}
              className="flex-1 py-3.5 rounded-2xl font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50">
              {busy ? 'Cancelling…' : 'Cancel Reservation'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}