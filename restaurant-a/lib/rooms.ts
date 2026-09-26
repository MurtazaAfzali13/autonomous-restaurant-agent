
import 'server-only'
import { supabaseAdmin } from './supabase-admin'
 
export type Room = {
  id: number
  slug: string
  name: string
  type: 'standard' | 'deluxe' | 'suite' | 'royal'
  summary: string
  description: string | null
  price_per_night: number
  capacity: number
  beds: number
  size_m2: number | null
  view: string | null
  amenities: string[]
  image: string
  is_active: boolean
  created_by: number | null
  created_at: string
}

 
export async function getRooms(
  opts: { checkIn?: string; checkOut?: string; guests?: number } = {}
): Promise<Room[]> {
  if (opts.checkIn && opts.checkOut) {
    const { data, error } = await supabaseAdmin.rpc('available_rooms', {
      p_check_in: opts.checkIn,
      p_check_out: opts.checkOut,
      p_guests: opts.guests ?? 1,
    })
    if (error) throw error
    return (data ?? []) as Room[]
  }
 
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('price_per_night')
  if (error) throw error
  return (data ?? []) as Room[]
}