// lib/dashboard-stats.ts
import { OrderRow, normalizeOrderStatus } from '@/lib/order-types'
import { normalizeReservationStatus, STATUS_META, type ReservationStatus } from '@/lib/reservation-status'

export type RangeKey = 'today' | '7d' | '30d' | 'year'

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'This Month',
  year: 'This Year',
}

function rangeStart(range: RangeKey): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (range === 'today') return d
  if (range === '7d') {
    d.setDate(d.getDate() - 6)
    return d
  }
  if (range === '30d') {
    d.setDate(1)
    return d
  }
  d.setMonth(0, 1)
  return d
}

export function filterByRange<T extends { created_at: string }>(rows: T[], range: RangeKey): T[] {
  const start = rangeStart(range)
  return rows.filter((r) => new Date(r.created_at) >= start)
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

export function buildDailySeries(orders: OrderRow[], reservations: any[], range: RangeKey) {
  const start = rangeStart(range)
  const days: string[] = []
  const cursor = new Date(start)
  const end = new Date()
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  const foodByDay: Record<string, number> = {}
  const roomByDay: Record<string, number> = {}
  for (const o of orders) {
    const k = dayKey(o.created_at)
    foodByDay[k] = (foodByDay[k] ?? 0) + Number(o.total_price)
  }
  for (const r of reservations) {
    const k = dayKey(r.created_at)
    roomByDay[k] = (roomByDay[k] ?? 0) + Number(r.total_price)
  }

  return days.map((d) => ({
    date: d.slice(5), // MM-DD
    Food: Math.round((foodByDay[d] ?? 0) * 100) / 100,
    Rooms: Math.round((roomByDay[d] ?? 0) * 100) / 100,
  }))
}

export function reservationStatusCounts(reservations: any[]) {
  const counts: Record<ReservationStatus, number> = {
    pending: 0,
    confirmed: 0,
    checked_in: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  }
  for (const r of reservations) counts[normalizeReservationStatus(r.status)]++

  return (Object.keys(counts) as ReservationStatus[])
    .filter((k) => counts[k] > 0)
    .map((k) => ({ name: STATUS_META[k].label, value: counts[k], key: k }))
}

export function orderStatusCounts(orders: OrderRow[]) {
  const counts: Record<string, number> = { pending: 0, cooking: 0, delivered: 0 }
  for (const o of orders) counts[normalizeOrderStatus(o.status)]++
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: key, value, key }))
}
