import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'
import { classifyAvionics } from '@/lib/avionicsClassify'
import type { AvionicsCap } from '@/lib/avionicsClassify'

const AVIONICS_CHIP_STYLE: Record<string, string> = {
  'glass-panel': 'bg-violet-50 text-violet-700 ring-violet-200',
  'ads-b':       'bg-sky-50 text-sky-700 ring-sky-200',
  'autopilot':   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'waas-gps':    'bg-sky-50 text-sky-700 ring-sky-200',
  'gps-nav':     'bg-slate-50 text-slate-600 ring-slate-200',
}

function AvionicsOverlayChip({ cap }: { cap: AvionicsCap }) {
  return (
    <span
      className={cn(
        'absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
        AVIONICS_CHIP_STYLE[cap.key] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
      )}
      title={cap.hint}
    >
      {cap.label}
    </span>
  )
}

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

export default function AircraftRailCard({
  p,
  discountPct,
  compVerdict,
}: {
  p: AircraftForSale
  /** When set (deals rail), shows an emerald "~X% below average" pill on the
   *  photo. Same wording as the full-card `CompPill` so the two stay in sync. */
  discountPct?: number
  /** When set (similar-aircraft rail), shows a "Good deal" or "Priced high" chip
   *  derived from the family-median estimate. Ignored when discountPct is set. */
  compVerdict?: 'below' | 'above'
}) {
  const label = aircraftTitle(p)
  // Real harvested photo when present (homepage rails pass photoOnly, so on the
  // homepage this is always set); else the per-make placeholder.
  const realPhoto = pickRealPhoto(p.images)
  const imageUrl = realPhoto ?? getPlaceholderPhoto(p.make ?? '')
  const isPlaceholder = !realPhoto
  // Top avionics capability chip — glass panel first, then ADS-B, autopilot.
  const topAvionicsCap = classifyAvionics(p.avionics)?.caps[0] ?? null

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
        {discountPct != null ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            ~{discountPct}% below average
          </span>
        ) : compVerdict === 'below' ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Good deal
          </span>
        ) : compVerdict === 'above' ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Priced high
          </span>
        ) : null}
        {isPlaceholder && (
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        )}
        {topAvionicsCap && <AvionicsOverlayChip cap={topAvionicsCap} />}
      </div>

      {/* Details — fixed height so cards align regardless of whether location is present */}
      <div className="flex h-24 flex-col justify-between p-4">
        <div>
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
        </div>
        <p className="flex items-center gap-1 truncate text-sm text-slate-500">
          {p.location ? (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{p.location}</span>
            </>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </p>
      </div>
    </Link>
  )
}
