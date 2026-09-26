// app/api/admin/upload-url/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, handleError } from '@/lib/session'

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { ext } = await req.json()
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return NextResponse.json({ error: 'فرمت نامعتبر' }, { status: 400 })
    const path = `rooms/${crypto.randomUUID()}.${ext}`
    const { data, error } = await supabaseAdmin.storage.from('room-images').createSignedUploadUrl(path)
    if (error) throw error
    const { data: pub } = supabaseAdmin.storage.from('room-images').getPublicUrl(path)
    return NextResponse.json({ path, token: data.token, publicUrl: pub.publicUrl })
  } catch (e) { return handleError(e) }
}