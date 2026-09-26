// app/api/rooms/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, handleError } from '@/lib/session'
import { roomSchema } from '@/lib/validators'
import { getRooms } from '@/lib/rooms'

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams
    const rooms = await getRooms({
      checkIn: p.get('check_in') ?? undefined,
      checkOut: p.get('check_out') ?? undefined,
      guests: Number(p.get('guests') ?? 1),
    })
    return NextResponse.json(rooms)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const { gallery, ...room } = roomSchema.parse(await req.json())
    const slug = `${room.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await supabaseAdmin
      .from('rooms').insert({ ...room, slug, created_by: admin.id }).select().single()
    if (error) throw error

    if (gallery.length) {
      await supabaseAdmin.from('room_images').insert(
        gallery.map((url, i) => ({ room_id: data.id, url, sort_order: i }))
      )
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) { return handleError(e) }
}