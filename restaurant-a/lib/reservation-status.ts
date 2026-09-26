// lib/reservation-status.ts
//
// Single source of truth for room-reservation status: labels, colors, which
// transitions are allowed and by whom, and date-based guards. Import this
// wherever a reservation status is read or changed — the API routes, the
// admin/user UI, and later the room-booking chatbot tools — so every part
// of the app agrees on the exact same rules.

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type Role = 'admin' | 'user'

export const RESERVATION_STATUSES: ReservationStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
]

// Statuses that still hold the room's dates (block other bookings for the
// same date range). MUST match the DB exclusion constraint's WHERE clause
// and the "booked dates" API filter.
export const ACTIVE_HOLD_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'checked_in']

// The normal, happy-path order of statuses — used to render a step timeline.
export const TIMELINE_STEPS: ReservationStatus[] = ['pending', 'confirmed', 'checked_in', 'completed']

export function normalizeReservationStatus(status: string | null | undefined): ReservationStatus {
  return (RESERVATION_STATUSES as string[]).includes(status ?? '')
    ? (status as ReservationStatus)
    : 'pending'
}

export const STATUS_META: Record<
  ReservationStatus,
  { label: string; badge: string; description: string }
> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    description: 'Guest booked the room. Waiting for admin to confirm.',
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Admin confirmed the booking. Room is held for these dates.',
  },
  checked_in: {
    label: 'Checked in',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    description: 'Guest has arrived and is currently staying in the room.',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    description: 'Stay finished. Guest has checked out.',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    description: 'Booking was cancelled. Dates are free again.',
  },
  no_show: {
    label: 'No-show',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    description: 'Guest never arrived. Dates are free again.',
  },
}

// Every allowed transition, and who is allowed to make it.
const TRANSITIONS: { from: ReservationStatus; to: ReservationStatus; by: Role[] }[] = [
  { from: 'pending', to: 'confirmed', by: ['admin'] },
  { from: 'pending', to: 'cancelled', by: ['admin', 'user'] },
  { from: 'confirmed', to: 'checked_in', by: ['admin'] },
  { from: 'confirmed', to: 'cancelled', by: ['admin', 'user'] },
  { from: 'confirmed', to: 'no_show', by: ['admin'] },
  { from: 'checked_in', to: 'completed', by: ['admin'] },
]

export function canTransition(from: ReservationStatus, to: ReservationStatus, role: Role): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to && t.by.includes(role))
}

export function allowedNextStatuses(from: ReservationStatus, role: Role): ReservationStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && t.by.includes(role)).map((t) => t.to)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// The guest may only cancel before the stay has started.
export function userCanCancel(status: ReservationStatus, checkIn: string): boolean {
  return (status === 'pending' || status === 'confirmed') && checkIn > today()
}

// Admin may only check a guest in on or after the check-in date.
export function adminCanCheckIn(status: ReservationStatus, checkIn: string): boolean {
  return status === 'confirmed' && checkIn <= today()
}

// Admin may only mark no-show once the check-in date has passed without a check-in.
export function adminCanMarkNoShow(status: ReservationStatus, checkIn: string): boolean {
  return status === 'confirmed' && checkIn < today()
}
