// components/rooms/RoomCard.tsx
import Image from 'next/image'
import Link from 'next/link'
import { Wifi, Tv, Snowflake, Coffee, Bath, Users, BedDouble, Maximize2 } from 'lucide-react'

const ICONS: Record<string, any> = { wifi: Wifi, tv: Tv, ac: Snowflake, breakfast: Coffee, bath: Bath }

export default function RoomCard({ room, query }: { room: any; query?: string }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur
                        transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40
                        hover:shadow-[0_24px_60px_-24px_rgba(16,185,129,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={room.image} alt={room.name} fill sizes="(max-width:768px) 100vw, 33vw"
               className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium
                         capitalize text-violet-200 ring-1 ring-violet-400/30 backdrop-blur">{room.type}</span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-bold text-white">{room.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{room.summary}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1"><Users size={14} /> {room.capacity}</span>
          <span className="flex items-center gap-1"><BedDouble size={14} /> {room.beds}</span>
          {room.size_m2 && <span className="flex items-center gap-1"><Maximize2 size={14} /> {room.size_m2} m²</span>}
        </div>

        <div className="flex gap-2">
          {room.amenities.slice(0, 5).map((a: string) => {
            const Icon = ICONS[a]
            return Icon && (
              <span key={a} title={a} className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-emerald-300">
                <Icon size={15} />
              </span>
            )
          })}
        </div>

        <div className="flex items-end justify-between border-t border-white/10 pt-4">
          <p className="text-2xl font-extrabold text-emerald-400">
            ${room.price_per_night}<span className="text-xs font-normal text-slate-400"> / night</span>
          </p>
          <Link href={`/rooms/${room.slug}${query ?? ''}`}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm
                           font-semibold text-white transition hover:brightness-110 active:scale-95">
            View & Reserve
          </Link>
        </div>
      </div>
    </article>
  )
}