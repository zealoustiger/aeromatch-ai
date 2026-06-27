import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { formatPrice, aircraftLabel } from '@/lib/utils'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'

/**
 * Compact, photo-forward rail card for a co-ownership partnership — the partnership
 * twin of `AircraftRailCard`, used in the marketplace cross-sell mini-rail (slice 3
 * of "Blend result types + cross-sell"). Links to the on-platform partnership detail
 * page (`/partnerships/[id]`), and reuses the slice-1 `.ch-card` token +
 * `getPlaceholderPhoto` (make-keyed, badged "Not actual plane photo") for visual
 * cohesion with the aircraft rail. Presentational only — no DB read here.
 */
export default function PartnershipRailCard({
  p,
  compVerdict,
}: {
  p: Partnership
  /** When set (similar-partnerships rail), shows a "Below market" or "Above market"
   *  chip derived from the same-make buy-in median. */
  compVerdict?: 'below' | 'above'
}) {
  const label = aircraftLabel(p.make, p.model, p.year)
  const realPhoto = pickRealPhoto(p.images)
  const imageUrl = realPhoto ?? getPlaceholderPhoto(p.make ?? '')
  const isPlaceholder = !realPhoto

  return (
    <Link
      href={`/partnerships/${p.id}`}
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
        {compVerdict === 'below' ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Below market
          </span>
        ) : compVerdict === 'above' ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Above market
          </span>
        ) : null}
        {isPlaceholder && (
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="text-lg font-bold text-slate-900">
          {p.buy_in_price ? (
            formatPrice(p.buy_in_price)
          ) : p.monthly_fixed ? (
            <span className="text-base">{formatPrice(p.monthly_fixed)}/mo</span>
          ) : (
            <span className="text-base text-slate-400">Contact for cost</span>
          )}
          {p.buy_in_price ? <span className="text-xs font-medium text-slate-400"> buy-in</span> : null}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800 group-hover:text-sky-700">
          {label}
        </p>
        {(p.city || p.home_airport) && (
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {p.city ? `${p.city}${p.state ? `, ${p.state}` : ''}` : p.home_airport}
            </span>
          </p>
        )}
      </div>
    </Link>
  )
}
