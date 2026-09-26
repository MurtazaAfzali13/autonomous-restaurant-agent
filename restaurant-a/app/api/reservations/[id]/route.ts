// app/api/reservations/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, handleError, HttpError } from '@/lib/session'
import {
  canTransition,
  normalizeReservationStatus,
  type ReservationStatus,
} from '@/lib/reservation-status'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*, rooms(name, image, slug), users(firstname, lastname, email)')
      .eq('id', id)
      .single()
    if (error || !data) throw new HttpError(404, 'Reservation not found')
    if (user.role !== 'admin' && data.user_id !== user.id) throw new HttpError(403, 'Forbidden')
    return NextResponse.json(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const nextStatus = normalizeReservationStatus(body.status)

    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('user_id, status, check_in')
      .eq('id', id)
      .single()
    if (!reservation) throw new HttpError(404, 'Reservation not found')

    if (user.role !== 'admin' && reservation.user_id !== user.id) {
      throw new HttpError(403, 'Forbidden')
    }

    const currentStatus = normalizeReservationStatus(reservation.status)

    // date-gated moves, on top of the plain role/from/to check
    const today = new Date().toISOString().slice(0, 10)
    if (nextStatus === 'checked_in' && reservation.check_in > today) {
      throw new HttpError(400, 'Cannot check in before the check-in date')
    }
    if (nextStatus === 'no_show' && reservation.check_in >= today) {
      throw new HttpError(400, 'Cannot mark no-show before the check-in date has passed')
    }
    if (user.role === 'user' && nextStatus === 'cancelled' && reservation.check_in <= today) {
      throw new HttpError(400, 'Too late to cancel this reservation')
    }

    if (!canTransition(currentStatus, nextStatus, user.role)) {
      throw new HttpError(400, `Cannot move a "${currentStatus}" reservation to "${nextStatus}"`)
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('*, rooms(name, image, slug), users(firstname, lastname, email)')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    return handleError(e)
  }
}
