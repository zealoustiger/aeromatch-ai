'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Users, ExternalLink } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { formatPrice, formatShareType, aircraftLabel, cn } from '@/lib/utils'
import { getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { track } from '@/lib/analytics'

const shareColors: Record<string, string> = {
  '1/2': 'bg-violet-50 text-violet-700 ring-violet-200',
  '1/3': 'bg-sky-50 text-sky-700 ring-sky-200',
  '1/4': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  leaseback: 'bg-amber-50 text-amber-700 ring-amber-200',
  dry_lease: 'bg-slate-100 text-slate-700 ring-slate-200',
  other: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export default function PartnershipCard({ p }: { p: Partnership }) {
  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const shareColor = shareColors[p.share_type] ?? shareColors.other
  const imageUrl = p.images?.[0] ?? getPlaceholderPhoto(p.make, p.id)
  const isPlaceholder = p.image_is_placeholder !== false && !p.images?.[0]

  return (
    <article className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-sky-300 hover:shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* Photo */}
        <Link href={`/partnerships/${p.id}`} className="relative sm:w-52 sm:shrink-0 h-44 sm:h-auto block">
          <Image
            src={imageUrl}
            alt={aircraft}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 208px"
          />
          {isPlaceholder && (
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              Not actual plane photo
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', shareColor)}>
                  {formatShareType(p.share_type)}
                </span>
                {p.registration && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600 ring-1 ring-slate-200">
                    {p.registration}
                  </span>
                )}
              </div>

              {/* Title */}
              <Link href={`/partnerships/${p.id}`}>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-sky-700 leading-snug">
                  {p.title}
                </h2>
              </Link>
              <p className="mt-0.5 text-sm font-medium text-slate-500">{aircraft}</p>

              {/* Description preview */}
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
              )}
            </div>

            {/* Cost summary */}
            <div className="shrink-0 rounded-lg bg-slate-50 p-3 text-right ring-1 ring-slate-100 sm:min-w-[148px]">
              {p.buy_in_price ? (
                <div>
                  <p className="text-xs text-slate-400">Buy-in</p>
                  <p className="text-lg font-bold text-slate-900">{formatPrice(p.buy_in_price)}</p>
                </div>
              ) : null}
              {p.monthly_fixed ? (
                <div className="mt-1">
                  <p className="text-xs text-slate-400">Monthly fixed</p>
                  <p className="text-sm font-semibold text-slate-700">{formatPrice(p.monthly_fixed)}/mo</p>
                </div>
              ) : null}
              {p.hourly_wet ? (
                <div className="mt-1">
                  <p className="text-xs text-slate-400">Wet rate</p>
                  <p className="text-sm font-semibold text-slate-700">{formatPrice(p.hourly_wet)}/hr</p>
                </div>
              ) : null}
              {!p.buy_in_price && !p.monthly_fixed && (
                <p className="text-sm text-slate-400">Contact for pricing</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <Link
                href={`/airports/${p.home_airport.toLowerCase()}`}
                className="font-semibold text-slate-700 hover:text-sky-700"
              >
                {p.home_airport}
              </Link>
              {p.city && ` · ${p.city}, ${p.state}`}
            </span>
            {p.min_hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {p.min_hours}+ hrs required
              </span>
            )}
            {p.ratings_required && p.ratings_required.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {p.ratings_required.join(', ')}
              </span>
            )}

            {/* Original post link */}
            {p.source_url && (
              <a
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation()
                  track('source_link_clicked', { listing_id: p.id, source_url: p.source_url })
                }}
                className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-200 hover:bg-sky-50 transition-colors"
              >
                View original post <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
