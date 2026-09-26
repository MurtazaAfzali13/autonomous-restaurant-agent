// app/api/rooms/[id]/booked/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { handleError } from '@/lib/session'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('check_in, check_out')          // هیچ اطلاعات کاربری برنمی‌گردد
      .eq('room_id', id)
      .in('status', ['pending', 'confirmed'])
      .gte('check_out', today)
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) { return handleError(e) }
}