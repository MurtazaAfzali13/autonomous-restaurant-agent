// lib/rooms.ts  (هم صفحه‌های سرور و هم API از آن استفاده می‌کنند)
import 'server-only'
import { supabaseAdmin } from './supabase-admin'

export async function getRooms(opts: { checkIn?: string; checkOut?: string; guests?: number } = {}) {
  if (opts.checkIn && opts.checkOut) {
    const { data, error } = await supabaseAdmin.rpc('available_rooms', {
      p_check_in: opts.checkIn, p_check_out: opts.checkOut, p_guests: opts.guests ?? 1,
    })
    if (error) throw error
    return data
  }
  const { data, error } = await supabaseAdmin
    .from('rooms').select('*').eq('is_active', true).order('price_per_night')
  if (error) throw error
  return data
}