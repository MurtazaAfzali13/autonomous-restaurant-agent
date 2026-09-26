// app/reservations/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BedDouble } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  completed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

export default function MyReservationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.email) { router.push('/auth?next=/reservations'); return }
    fetch('/api/reservations').then(r => r.json()).then(setRows).finally(() => setLoading(false))
  }, [session, status, router])

  if (status === 'loading' || loading)
    return <section className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-emerald-400">Loading…</section>

  return (
    <section className="min-h-screen bg-[#0a0f1a] text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-2">My Reservations</h1>
        <p className="text-slate-400 mb-10">Track the rooms you've booked.</p>

        {!rows.length ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center max-w-lg">
            <BedDouble className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-6">No reservations yet.</p>
            <Link href="/rooms" className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-500/20">
              Browse Rooms
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {rows.map(r => (
              <li key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:-translate-y-1 transition">
                <Link href={`/reservations/${r.id}`}>
                  <div className="relative aspect-[16/9]">
                    <Image src={r.rooms.image} alt={r.rooms.name} fill className="object-cover" />
                    <span className={`absolute top-3 left-3 text-xs font-bold uppercase px-3 py-1 rounded-full border ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-white">{r.rooms.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">{r.check_in} → {r.check_out} · {r.nights} nights</p>
                    <p className="mt-3 text-xl font-black text-emerald-400">${Number(r.total_price).toFixed(2)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}