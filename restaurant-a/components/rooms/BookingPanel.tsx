// components/rooms/BookingPanel.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DayPicker, type DateRange } from 'react-day-picker'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Minus, Plus } from 'lucide-react'
import 'react-day-picker/style.css'
import ConfirmReservationModal from './ConfirmReservationModal'

export default function BookingPanel({
  room,
}: {
  room: { id: number; slug: string; price_per_night: number; capacity: number }
}) {
  const router = useRouter()
  const [range, setRange] = useState<DateRange>()
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [booked, setBooked] = useState<{ from: Date; to: Date }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/rooms/${room.id}/booked`)
      .then((r) => r.json())
      .then((rows: any[]) =>
        setBooked(
          rows.map((r) => ({
            from: parseISO(r.check_in),
            to: addDays(parseISO(r.check_out), -1),
          }))
        )
      )
  }, [room.id])

  const nights =
    range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0
  const total = useMemo(() => nights * room.price_per_night, [nights, room.price_per_night])
  const guests = adults + children

  async function reserve() {
    if (!range?.from || !range?.to) return
    setBusy(true)
    setError('')

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: room.id,
        adults,
        children,
        check_in: format(range.from, 'yyyy-MM-dd'),
        check_out: format(range.to, 'yyyy-MM-dd'),
      }),
    })

    setBusy(false)

    if (res.status === 401) {
      setConfirmOpen(false)
      return router.push(`/auth?next=/rooms/${room.slug}`)
    }

    if (!res.ok) {
      setConfirmOpen(false)
      const body = await res.json().catch(() => ({}))
      return setError(body.error || 'Something went wrong. Please try again.')
    }

    const data = await res.json()
    setConfirmOpen(false)
    router.push(`/reservations/${data.id}`)
  }

  function Stepper({
    label,
    value,
    set,
    min,
    max,
  }: {
    label: string
    value: number
    set: (v: number) => void
    min: number
    max: number
  }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set(Math.max(min, value - 1))}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30"
            disabled={value <= min}
          >
            <Minus size={14} />
          </button>
          <span className="w-4 text-center font-semibold">{value}</span>
          <button
            type="button"
            onClick={() => guests < max && set(value + 1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30"
            disabled={guests >= max}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <aside className="sticky top-24 space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white backdrop-blur-xl">
        <p className="text-2xl font-extrabold text-emerald-400">
          ${room.price_per_night}
          <span className="text-sm font-normal text-slate-400"> / night</span>
        </p>

        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          min={1}
          excludeDisabled
          disabled={[{ before: new Date() }, ...booked]}
          modifiers={{ booked }}
          modifiersClassNames={{ booked: 'line-through opacity-40' }}
        />

        <div className="space-y-3">
          <Stepper label="Adults" value={adults} set={setAdults} min={1} max={room.capacity} />
          <Stepper label="Children" value={children} set={setChildren} min={0} max={room.capacity} />
        </div>

        {nights > 0 && (
          <div className="space-y-2 rounded-2xl bg-white/5 p-4 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>
                ${room.price_per_night} × {nights} nights
              </span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-emerald-400">${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>
        )}

        <button
          disabled={!nights || busy}
          onClick={() => setConfirmOpen(true)}
          className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 font-semibold
                     transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm reservation
        </button>
      </aside>

      <ConfirmReservationModal
        open={confirmOpen}
        nights={nights}
        total={total}
        checkIn={range?.from ? format(range.from, 'MMM d, yyyy') : ''}
        checkOut={range?.to ? format(range.to, 'MMM d, yyyy') : ''}
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={reserve}
      />
    </>
  )
}
