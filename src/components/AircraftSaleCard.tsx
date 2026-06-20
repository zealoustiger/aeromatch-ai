'use client'

import Image from 'next/image'
import { MapPin, ExternalLink, Gauge, Wrench, TrendingDown, Sparkles } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { track } from '@/lib/analytics'
import { gradeFromScore, gradeMeta } from '@/lib/listingQuality'

const DAY_MS = 86_400_000

// A listing is "new" if first seen within the last week.
function isNew(firstSeenAt: string | null): boolean {
  if (!firstSeenAt) return false
  return Date.now() - new Date(firstSeenAt).getTime() < 7 * DAY_MS
}

// Confirmed price drop: we recorded a higher previous price.
function priceDrop(p: AircraftForSale): number | null {
  if (p.previous_price != null && p.asking_price != null && p.asking_price < p.previous_price) {
    return p.previous_price - p.asking_price
  }
  return null
}

// Human-friendly labels for known aggregation sources.
const SOURCE_LABELS: Record<string, string> = {
  barnstormers: 'Barnstormers',
  hangar67: 'Hangar67',
  aircraftforsale: 'AircraftForSale',
  globalplanesearch: 'GlobalPlaneSearch',
  'trade-a-plane': 'Trade-A-Plane',
  controller: 'Controller',
  user: 'Listed here',
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source
}

function aircraftTitle(p: AircraftForSale): string {
  const parts = [p.year, p.make, p.model].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Aircraft'
}

export default function AircraftSaleCard({ p }: { p: AircraftForSale }) {
  const label = aircraftTitle(p)
  const imageUrl = getPlaceholderPhoto(p.make ?? '')
  const isExternal = p.source !== 'user'
  const source = sourceLabel(p.source)
  const drop = priceDrop(p)
  const fresh = isNew(p.first_seen_at)
  const grade = gradeFromScore(p.quality_score)
  const gm = gradeMeta(grade)

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-sky-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <a
          href={p.source_url ?? '#'}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="relative block h-44 sm:h-auto sm:w-52 sm:shrink-0"
        >
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 208px"
          />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        </a>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {source}
                </span>
                <span
                  title={gm.blurb}
                  className={cn('rounded-full px-2 py-0.5 text-xs font-bold ring-1', gm.chip)}
                >
                  {gm.short}
                </span>
                {drop != null && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <TrendingDown className="h-3 w-3" />
                    Price drop {formatPrice(drop)}
                  </span>
                )}
                {fresh && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Sparkles className="h-3 w-3" />
                    New
                  </span>
                )}
                {p.registration && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {p.registration}
                  </span>
                )}
              </div>

              {/* Title */}
              <a
                href={p.source_url ?? '#'}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                <h2 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-sky-700">
                  {p.title}
                </h2>
              </a>
              <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>

              {/* Description preview */}
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="shrink-0 rounded-lg bg-slate-50 p-3 text-right ring-1 ring-slate-100 sm:min-w-[148px]">
              {p.asking_price ? (
                <div>
                  <p className="text-xs text-slate-400">Asking</p>
                  <p className="text-lg font-bold text-slate-900">{formatPrice(p.asking_price)}</p>
                  {drop != null && (
                    <p className="text-xs text-slate-400 line-through">{formatPrice(p.previous_price)}</p>
                  )}
                </div>
              ) : p.price_text ? (
                <div>
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="text-sm font-semibold capitalize text-slate-700">{p.price_text}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Contact for price</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium text-slate-600">{p.location}</span>
              </span>
            )}
            {p.ttaf != null && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {p.ttaf.toLocaleString()} TTAF
              </span>
            )}
            {p.smoh != null && (
              <span className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" />
                {p.smoh.toLocaleString()} SMOH
              </span>
            )}

            {p.source_url && (
              <a
                href={p.source_url}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                onClick={() =>
                  track('sale_source_link_clicked', {
                    listing_id: p.id,
                    source: p.source,
                    source_url: p.source_url,
                  })
                }
                className={cn(
                  'ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-200 transition-colors hover:bg-sky-50'
                )}
              >
                {isExternal ? `View on ${source}` : 'View listing'} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
