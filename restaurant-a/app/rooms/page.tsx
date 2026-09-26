// app/rooms/page.tsx
import { getRooms } from '@/lib/rooms'
import RoomCard from '@/components/rooms/RoomCard'

export default async function RoomsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const rooms = await getRooms({ checkIn: sp.check_in, checkOut: sp.check_out, guests: Number(sp.guests ?? 1) })
  const qs = sp.check_in ? `?check_in=${sp.check_in}&check_out=${sp.check_out}&guests=${sp.guests ?? 1}` : ''
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-white">Rooms & Suites</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r: any) => <RoomCard key={r.id} room={r} query={qs} />)}
      </div>
      {!rooms.length && <p className="mt-16 text-center text-slate-400">No rooms are available for these dates.</p>}
    </main>
  )
}