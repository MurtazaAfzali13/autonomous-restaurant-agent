// app/rooms/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase-admin'
import BookingPanel from '@/components/rooms/BookingPanel'

async function getRoomBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*, room_images(url, sort_order)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const room = await getRoomBySlug(slug)

  if (!room) notFound()

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 text-white">
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            <Image src={room.image} alt={room.name} fill className="object-cover" priority />
          </div>
          <h1 className="text-3xl font-extrabold">{room.name}</h1>
          <p className="text-slate-400">{room.description || room.summary}</p>
        </div>

        <BookingPanel room={room} />
      </div>
    </main>
  )
}