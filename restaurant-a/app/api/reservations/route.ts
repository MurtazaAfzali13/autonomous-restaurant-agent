// app/api/reservations/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser, handleError, HttpError } from '@/lib/session'
import { reservationSchema } from '@/lib/validators'

const DAY = 86_400_000

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const b = reservationSchema.parse(await req.json())

    const nights = (Date.parse(b.check_out) - Date.parse(b.check_in)) / DAY
    const today = new Date().toISOString().slice(0, 10)
    if (b.check_in < today) throw new HttpError(400, 'تاریخ ورود گذشته است')
    if (nights < 1 || nights > 30) throw new HttpError(400, 'مدت اقامت باید ۱ تا ۳۰ شب باشد')

    const { data: room } = await supabaseAdmin
      .from('rooms').select('id, price_per_night, capacity, is_active')
      .eq('id', b.room_id).single()
    if (!room || !room.is_active) throw new HttpError(404, 'اتاق پیدا نشد')
    if (b.adults + b.children > room.capacity) throw new HttpError(400, 'ظرفیت اتاق کمتر است')

    const { data, error } = await supabaseAdmin.from('reservations').insert({
      user_id: user.id,
      room_id: room.id,
      check_in: b.check_in,
      check_out: b.check_out,
      adults: b.adults,
      children: b.children,
      special_requests: b.special_requests,
      price_per_night: room.price_per_night,
      total_price: nights * Number(room.price_per_night),   // قیمت فقط از سرور
    }).select().single()

    // 23P01 = نقض exclusion constraint یعنی کسی همزمان همان تاریخ را گرفت
    if (error?.code === '23P01') throw new HttpError(409, 'این تاریخ‌ها همین الان رزرو شد. تاریخ دیگری انتخاب کنید')
    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function GET() {
  try {
    const user = await requireUser()
    let q = supabaseAdmin
      .from('reservations')
      .select('*, rooms(name, image, slug), users(firstname, lastname, email)')
      .order('created_at', { ascending: false })
    if (user.role !== 'admin') q = q.eq('user_id', user.id)   // کاربر عادی فقط رزروهای خودش
    const { data, error } = await q
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) { return handleError(e) }
}