import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'

/**
 * Compact, photo-forward rail card for the homepage curated rails (slice 4).
 * Mirrors the FeaturedListingCard look (rounded photo on top, price-first
 * details) but sized for a horizontal rail item, and reuses the slice-1
 * `.ch-card` token + `getPlaceholderPhoto` + `formatPrice` for visual cohesion
 * with the rest of the marketplace. Links to the listing's INTERNAL detail page
 * (`/aircraft/listing/[id]`), mirroring how `AircraftSaleCard` links its photo +
 * title — keeps homepage clicks (and crawlers) on-site, spreading internal-link
 * reachability into the sitemapped detail family. Presentational only — no DB read.
 */
function aircraftTitle(p: AircraftForSale): string {
  const parts = [p.year, p.make, p.model].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Aircraft'
}

export default function AircraftRailCard({ p }: { p: AircraftForSale }) {
  const label = aircraftTitle(p)
  const imageUrl = getPlaceholderPhoto(p.make ?? '')

  return (
    <Link
      href={`/aircraft/listing/${p.id}`}
      className="ch-card group block w-60 shrink-0 overflow-hidden bg-white sm:w-64"
    >
      {/* Photo */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={label}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="256px"
        />
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          Not actual plane photo
        </span>
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="text-lg font-bold text-slate-900">
          {p.asking_price
            ? formatPrice(p.asking_price)
            : p.price_text
              ? <span className="text-base capitalize">{p.price_text}</span>
              : <span className="text-base text-slate-400">Contact for price</span>}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800 group-hover:text-sky-700">
          {label}
        </p>
        {p.location && (
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{p.location}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
