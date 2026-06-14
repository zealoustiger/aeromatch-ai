import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel } from '@/lib/utils'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

/** Redfin-style photo-forward card: large image on top, price-first details below. */
export default function FeaturedListingCard({ p }: { p: Partnership }) {
  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const imageUrl = p.images?.[0] ?? getPlaceholderPhoto(p.make, p.id)
  const isPlaceholder = p.image_is_placeholder !== false && !p.images?.[0]

  return (
    <Link
      href={`/partnerships/${p.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Photo */}
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={aircraft}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
          {formatShareType(p.share_type)}
        </span>
        {isPlaceholder && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xl font-bold text-slate-900">
            {p.buy_in_price ? formatPrice(p.buy_in_price) : 'Contact'}
            {p.buy_in_price ? <span className="text-sm font-medium text-slate-400"> buy-in</span> : null}
          </p>
          {p.monthly_fixed ? (
            <p className="text-sm font-semibold text-slate-600">{formatPrice(p.monthly_fixed)}<span className="font-normal text-slate-400">/mo</span></p>
          ) : null}
        </div>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">{aircraft}</p>

        <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="font-mono font-semibold text-slate-600">{p.home_airport}</span>
          {p.city && <span className="truncate">· {p.city}, {p.state}</span>}
        </p>
      </div>
    </Link>
  )
}
