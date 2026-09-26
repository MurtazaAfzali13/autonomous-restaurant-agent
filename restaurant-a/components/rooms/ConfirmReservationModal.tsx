// components/rooms/ConfirmReservationModal.tsx
'use client'

export default function ConfirmReservationModal({
  open, nights, total, checkIn, checkOut, busy, onConfirm, onCancel,
}: {
  open: boolean; nights: number; total: number; checkIn: string; checkOut: string
  busy: boolean; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center text-white shadow-2xl">
        <h2 className="text-2xl font-black">Confirm Reservation</h2>
        <p className="mt-2 text-sm text-slate-400">
          {checkIn} → {checkOut} · {nights} night{nights > 1 ? 's' : ''}
        </p>
        <p className="mt-4 text-3xl font-extrabold text-emerald-400">${total.toFixed(2)}</p>

        <div className="mt-8 flex gap-3">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 rounded-2xl border border-slate-700 py-3 font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 rounded-2xl bg-emerald-500 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
            {busy ? 'Booking…' : 'Yes, Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}