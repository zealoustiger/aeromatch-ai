import Image from 'next/image'
import Link from 'next/link'
import { MapPin, CalendarClock, AlertTriangle, Gem } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'
import { classifyAvionics } from '@/lib/avionicsClassify'
import type { AvionicsCap } from '@/lib/avionicsClassify'
import { lookupEngineTbo } from '@/lib/engineLife'
import { computeAnnualStatus } from '@/lib/annualStatus'
import { computeDamageHistory } from '@/lib/damageHistory'

// Same honesty threshold as AircraftSaleCard's RareFindChip. Duplicated rather
// than imported: AircraftSaleCard.tsx is a 'use client' module, and importing
// even a plain constant from a client-component file into a server component
// (this file, rendered from async Server Components) crosses the RSC client/
// server boundary — the value doesn't come through as a real number, silently
// breaking every comparison. Keep this in sync with AircraftSaleCard's copy.
const RARE_FIND_MAX = 3

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

function formatHrsRemaining(hrs: number): string {
  const rounded = Math.round(hrs / 50) * 50
  if (rounded >= 1000) {
    const k = Math.round(rounded / 100) / 10
    return `~${k}k hrs to TBO`
  }
  return `~${rounded} hrs to TBO`
}

function engineChipStyle(remaining: number, tbo: number): string {
  if (remaining < 0) return 'bg-amber-50 text-amber-700 ring-amber-200'
  const frac = remaining / tbo
  if (frac > 0.5) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (frac > 0.15) return 'bg-sky-50 text-sky-700 ring-sky-200'
  return 'bg-amber-50 text-amber-700 ring-amber-200'
}

function EngineOverlayChip({ smoh, engineType }: { smoh: number; engineType: string }) {
  const entry = lookupEngineTbo(engineType)
  if (!entry) return null
  const remaining = entry.tboHours - smoh
  const label = remaining <= 0 ? 'Beyond TBO' : formatHrsRemaining(remaining)
  const style = engineChipStyle(remaining, entry.tboHours)
  return (
    <span
      className={cn('absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', style)}
      title={`${entry.family} · TBO ${entry.tboHours.toLocaleString()} hrs · ${smoh.toLocaleString()} hrs since overhaul`}
    >
      {label}
    </span>
  )
}

// Rail-card mirror of AircraftSaleCard's AnnualStatusChip/DamageHistoryChip —
// same honesty-gated helpers, same "only surface the actionable state" rule.
// A rail card only has room for one top-right badge, so when both are
// actionable, damage (the more consequential flag) wins.
function TrustOverlayChip({
  annualDue,
  damageHistory,
}: {
  annualDue: string | null
  damageHistory: boolean | null
}) {
  const damage = computeDamageHistory(damageHistory)
  if (damage && damage.state === 'reported') {
    return (
      <span
        className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200"
        title={damage.headline}
      >
        <AlertTriangle className="h-3 w-3" />
        Damage reported
      </span>
    )
  }
  const annual = computeAnnualStatus(annualDue, new Date())
  if (annual && annual.state !== 'current') {
    const label = annual.state === 'overdue' ? 'Annual overdue' : 'Annual due soon'
    return (
      <span
        className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200"
        title={annual.headline}
      >
        <CalendarClock className="h-3 w-3" />
        {label}
      </span>
    )
  }
  return null
}

// Rail-card mirror of AircraftSaleCard's RareFindChip — same honesty-gated
// threshold (RARE_FIND_MAX), same indigo tone, compact copy with the full
// count in the tooltip (matches TrustOverlayChip's short-label convention).
// Safe to share the top-left slot with discountPct/compVerdict: both of those
// require >= MIN_OTHER_COMPS (4) other comps, which a rare (<=3 total) family
// can never have, so the two states can't collide.
function RareFindOverlayChip({ count }: { count: number }) {
  return (
    <span
      className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
      title={`Only ${count} of this make + model currently for sale on ClubHanger`}
    >
      <Gem className="h-3 w-3" />
      Rare find
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
  familyCount = null,
}: {
  p: AircraftForSale
  /** When set (deals rail), shows an emerald "~X% below average" pill on the
   *  photo. Same wording as the full-card `CompPill` so the two stay in sync. */
  discountPct?: number
  /** When set (similar-aircraft rail), shows a "Good deal" or "Priced high" chip
   *  derived from the family-median estimate. Ignored when discountPct is set. */
  compVerdict?: 'below' | 'above'
  /** Real count of active, priced listings (incl. this one) in this listing's
   *  make+model family — powers the "Rare find" chip, same as `AircraftSaleCard`.
   *  `null`/unresolved means no chip. Ignored when discountPct/compVerdict is set
   *  (mutually exclusive by construction — see RareFindOverlayChip's comment). */
  familyCount?: number | null
}) {
  const label = aircraftTitle(p)
  const isRareFind = familyCount != null && familyCount >= 1 && familyCount <= RARE_FIND_MAX
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
        ) : isRareFind ? (
          <RareFindOverlayChip count={familyCount as number} />
        ) : null}
        <TrustOverlayChip annualDue={p.annual_due} damageHistory={p.damage_history} />
        {isPlaceholder ? (
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            Not actual plane photo
          </span>
        ) : p.smoh != null && p.engine_type ? (
          <EngineOverlayChip smoh={p.smoh} engineType={p.engine_type} />
        ) : null}
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
