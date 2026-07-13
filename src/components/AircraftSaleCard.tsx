'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ExternalLink, Gauge, Wrench, TrendingDown, Sparkles, Plane, LineChart, Clock, CalendarClock, AlertTriangle, Heart, Gem } from 'lucide-react'
import { AircraftForSale } from '@/lib/types'
import { formatPrice, formatPriceK, cn } from '@/lib/utils'
import {
  MAP_BOUNDS_FILTER_EVENT,
  MAP_FOCUS_LISTING_EVENT,
  type MapBoundsFilterDetail,
  type MapFocusListingDetail,
  focusPinFromList,
} from '@/lib/mapListSync'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'
import { track } from '@/lib/analytics'
import { gradeFromScore, gradeMeta } from '@/lib/listingQuality'
import { resolveMakeModelFamily } from '@/lib/seo'
import type { CompResult } from '@/lib/aircraftComps'
import type { ClubHangerDealVerdict } from '@/lib/aircraftEstimate'
import { classifyAvionics, computeIfrSuitability } from '@/lib/avionicsClassify'
import type { AvionicsCap, IfrTier } from '@/lib/avionicsClassify'
import { lookupEngineTbo } from '@/lib/engineLife'
import { computeAnnualStatus } from '@/lib/annualStatus'
import { computeDamageHistory } from '@/lib/damageHistory'
import { MIN_SAVES_TO_SHOW } from '@/lib/saveCounts'
import CompareToggle from './CompareToggle'
import SaveListingButton from './SaveListingButton'
import WatchAlertButton from './WatchAlertButton'
import AircraftTrustBadge from './AircraftTrustBadge'
import AlertSignup from './AlertSignup'

const DAY_MS = 86_400_000

// A listing is "new" if first seen within the last week.
function isNew(firstSeenAt: string | null): boolean {
  if (!firstSeenAt) return false
  return Date.now() - new Date(firstSeenAt).getTime() < 7 * DAY_MS
}

// Narrower than isNew — true only in the first 24h, so the badge can say
// "New today" instead of the generic week-long "New" (same real timestamp,
// just a tighter, more honest read for a listing that JUST appeared).
function isBrandNew(firstSeenAt: string | null): boolean {
  if (!firstSeenAt) return false
  return Date.now() - new Date(firstSeenAt).getTime() < DAY_MS
}

/** Max family size (this listing + others) for the "Rare find" chip. Above
 *  this the family isn't genuinely rare — no chip. Never shown at 0: a
 *  resolved family the current listing belongs to can't have a real count of
 *  0 (the listing itself would be in it), so 0 means the comp map failed to
 *  load — fail soft to no chip rather than show a self-contradictory count. */
const RARE_FIND_MAX = 3

// Redfin-style days-on-market label from when we first saw the listing.
// Returns null when we have no first_seen_at (so no empty/"null" chip renders).
function listedAgo(firstSeenAt: string | null): string | null {
  if (!firstSeenAt) return null
  const then = new Date(firstSeenAt).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / DAY_MS)
  if (days <= 0) return 'Listed today'
  if (days === 1) return 'Listed 1 day ago'
  if (days < 7) return `Listed ${days} days ago`
  if (days < 14) return 'Listed 1 week ago'
  if (days < 30) return `Listed ${Math.floor(days / 7)} weeks ago`
  if (days < 60) return 'Listed 1 month ago'
  if (days < 365) return `Listed ${Math.floor(days / 30)} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? 'Listed 1 year ago' : `Listed ${years} years ago`
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

// Small, honest "vs market" comp pill. Below-average is good for a buyer, so it
// gets a subtle positive (emerald) treatment; above/near average is neutral
// (slate) — informational, no dark pattern. Renders nothing when comp is null
// (sparse family or no price), so the badge is never fake/empty.
// The comp count is shown as a secondary denominator ("· 15 comps") so buyers
// scanning the grid immediately see the market depth behind the claim.
function CompPill({ comp }: { comp: CompResult }) {
  const medianK = formatPriceK(comp.median)
  const suffix = ` · ${medianK} · ${comp.count} comps`
  const titleAttr = `vs. median ${formatPrice(comp.median)}`
  if (comp.kind === 'near') {
    return (
      <span
        className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
        title={titleAttr}
      >
        <LineChart className="h-3 w-3" />
        Near avg{suffix}
      </span>
    )
  }
  if (comp.kind === 'below') {
    return (
      <span
        className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
        title={titleAttr}
      >
        <LineChart className="h-3 w-3" />
        ~{comp.pct}% below avg{suffix}
      </span>
    )
  }
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
      title={titleAttr}
    >
      <LineChart className="h-3 w-3" />
      ~{comp.pct}% above avg{suffix}
    </span>
  )
}

const AVIONICS_CHIP_STYLE: Record<string, string> = {
  glass: 'bg-violet-50 text-violet-700 ring-violet-200',
  adsb: 'bg-sky-50 text-sky-700 ring-sky-200',
  autopilot: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  waas: 'bg-sky-50 text-sky-700 ring-sky-200',
  gps: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function AvionicsChip({ cap }: { cap: AvionicsCap }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
        AVIONICS_CHIP_STYLE[cap.key] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
      )}
      title={cap.hint}
    >
      {cap.label}
    </span>
  )
}

// Compact label for remaining hours — rounded to nearest 50, abbreviated ≥ 1 000.
function formatHrsRemaining(hrs: number): string {
  const rounded = Math.round(hrs / 50) * 50
  if (rounded >= 1000) {
    const k = Math.round(rounded / 100) / 10
    return `~${k}k hrs to TBO`
  }
  return `~${rounded} hrs to TBO`
}

// Returns chip style class based on fraction of TBO remaining.
function engineChipStyle(remaining: number, tbo: number): string {
  if (remaining < 0) return 'bg-amber-50 text-amber-700 ring-amber-200'
  const frac = remaining / tbo
  if (frac > 0.5) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (frac > 0.15) return 'bg-sky-50 text-sky-700 ring-sky-200'
  return 'bg-amber-50 text-amber-700 ring-amber-200'
}

// Deal Check chip — shows the year+hours-controlled verdict when available.
// 'fair' is suppressed (no chip) to avoid noise; 'good' and 'high' carry signal.
function DealCheckChip({ verdict }: { verdict: ClubHangerDealVerdict }) {
  if (verdict.verdict === 'fair') return null
  if (verdict.verdict === 'good') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <LineChart className="h-3 w-3" />
        Good deal
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <LineChart className="h-3 w-3" />
      Priced high
    </span>
  )
}

function EngineTimeChip({ smoh, engineType }: { smoh: number; engineType: string }) {
  const entry = lookupEngineTbo(engineType)
  if (!entry) return null
  const remaining = entry.tboHours - smoh
  const label = remaining <= 0 ? 'Beyond TBO' : formatHrsRemaining(remaining)
  const style = engineChipStyle(remaining, entry.tboHours)
  return (
    <span
      className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', style)}
      title={`${entry.family} · TBO ${entry.tboHours.toLocaleString()} hrs · ${smoh.toLocaleString()} hrs since overhaul`}
    >
      {label}
    </span>
  )
}

const IFR_CARD_CHIP: Record<IfrTier, string> = {
  full:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  capable:  'bg-sky-50 text-sky-700 ring-sky-200',
  equipped: 'bg-slate-100 text-slate-600 ring-slate-200',
  basic:    'bg-slate-100 text-slate-600 ring-slate-200',
}

function IfrCardBadge({ caps }: { caps: AvionicsCap[] }) {
  const ifr = computeIfrSuitability(caps)
  if (!ifr || (ifr.tier !== 'full' && ifr.tier !== 'capable')) return null
  return (
    <span
      className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', IFR_CARD_CHIP[ifr.tier])}
      title={ifr.sub}
    >
      {ifr.headline}
    </span>
  )
}

// Card-level mirror of the detail page's AnnualStatusPanel — suppresses the common
// 'current' state (nothing to flag) and only surfaces the actionable soon/overdue cases,
// same clutter-avoidance convention as DealCheckChip suppressing 'fair'.
function AnnualStatusChip({ annualDue }: { annualDue: string | null }) {
  const status = computeAnnualStatus(annualDue, new Date())
  if (!status || status.state === 'current') return null
  const label = status.state === 'overdue' ? 'Annual overdue' : 'Annual due soon'
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
      title={status.headline}
    >
      <CalendarClock className="h-3 w-3" />
      {label}
    </span>
  )
}

// Card-level mirror of the detail page's DamageHistoryPanel — suppresses the common
// 'clean' state (no damage reported) and only surfaces the reported case.
function DamageHistoryChip({ damageHistory }: { damageHistory: boolean | null }) {
  const damage = computeDamageHistory(damageHistory)
  if (!damage || damage.state === 'clean') return null
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
      title={damage.headline}
    >
      <AlertTriangle className="h-3 w-3" />
      Damage reported
    </span>
  )
}

// Honest scarcity chip — only renders on a real, resolved family count of
// 1..RARE_FIND_MAX (never fabricated, never shown on an unresolved/failed count).
function RareFindChip({ count }: { count: number }) {
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
      title={`Only ${count} of this make + model currently for sale on ClubHanger`}
    >
      <Gem className="h-3 w-3" />
      Rare find — only {count} like this
    </span>
  )
}

export default function AircraftSaleCard({
  p,
  saved = false,
  comp = null,
  dealVerdict = null,
  saveCount = 0,
  familyCount = null,
  onMap = false,
}: {
  p: AircraftForSale
  saved?: boolean
  comp?: CompResult | null
  dealVerdict?: ClubHangerDealVerdict | null
  /** Real cross-user save count (see `saveCounts.ts`) — shows a "Saved by N
   *  pilots" chip only at/above `MIN_SAVES_TO_SHOW`; never fabricated. */
  saveCount?: number
  /** Real count of active, priced listings (incl. this one) in this listing's
   *  make+model family — powers the "Rare find" chip. `null` when the family
   *  can't be resolved or the comp map failed to load (no chip either way). */
  familyCount?: number | null
  /** True when this listing has a resolvable pin on the /aircraft map above the
   *  list — shows a "Show on map" affordance (list → map sync). Only ever
   *  passed true from that page; every other call site (saved, deals, rail,
   *  detail page — no map present) leaves it off. Mirrors PartnershipCard. */
  onMap?: boolean
}) {
  const label = aircraftTitle(p)
  // Real harvested source photo when we have one; else a per-make placeholder.
  // pickRealPhoto skips source "noimage" placeholders (which 400 the optimizer).
  const realPhoto = pickRealPhoto(p.images)
  const imageUrl = realPhoto ?? getPlaceholderPhoto(p.make ?? '')
  const isPlaceholder = !realPhoto
  const isExternal = p.source !== 'user'
  const source = sourceLabel(p.source)
  const drop = priceDrop(p)
  const fresh = isNew(p.first_seen_at)
  const brandNew = isBrandNew(p.first_seen_at)
  const listed = listedAgo(p.first_seen_at)
  const isRareFind = familyCount != null && familyCount >= 1 && familyCount <= RARE_FIND_MAX
  const grade = gradeFromScore(p.quality_score)
  const gm = gradeMeta(grade)
  // Internal link to the make+model for-sale family page — only when a real page
  // exists for this listing's make+model (reuses SEO_MAKE_MODELS, never 404s).
  const family = resolveMakeModelFamily(p.make, p.model)
  // Top 2 avionics capability chips — glass panel first, then ADS-B / autopilot.
  // For full/capable IFR tiers, IfrCardBadge shows the synthesized verdict instead.
  const avionicsCaps = classifyAvionics(p.avionics)?.caps ?? []
  const ifrTier = computeIfrSuitability(avionicsCaps)?.tier ?? null
  const showIfrBadge = ifrTier === 'full' || ifrTier === 'capable'
  // Same listing-scoped watch alert shape as the detail page's "Watch this
  // listing" box (`?watch=price` — the cron's parseSourcePath already
  // resolves it to a single-row watch, zero new matching logic here).
  const watchContext = [p.year, p.make, p.model].filter(Boolean).join(' ') || undefined
  const watchSourcePath = `/aircraft/listing/${p.id}?watch=price`
  const [watchOpen, setWatchOpen] = useState(false)

  // "Search this area" sync: when the map filters to its current viewport, hide
  // any card whose listing isn't among the visible pins. `ids === null` clears.
  // Mirrors PartnershipCard's identical logic.
  const [hiddenByArea, setHiddenByArea] = useState(false)
  useEffect(() => {
    function onBoundsFilter(e: Event) {
      const ids = (e as CustomEvent<MapBoundsFilterDetail>).detail?.ids
      setHiddenByArea(ids != null && !ids.includes(p.id))
    }
    window.addEventListener(MAP_BOUNDS_FILTER_EVENT, onBoundsFilter)
    return () => window.removeEventListener(MAP_BOUNDS_FILTER_EVENT, onBoundsFilter)
  }, [p.id])

  // Map → list sync: a click on this listing's map pin popup ("↓ Show in list")
  // scrolls it into view and briefly highlights it, so a visitor exploring the
  // map can jump straight to the matching card without re-scanning the list.
  // Mirrors PartnershipCard's identical logic.
  const [mapFocused, setMapFocused] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    function onFocus(e: Event) {
      const detail = (e as CustomEvent<MapFocusListingDetail>).detail
      if (detail?.id !== p.id) return
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setMapFocused(true)
      clearTimeout(timer)
      timer = setTimeout(() => setMapFocused(false), 2000)
    }
    window.addEventListener(MAP_FOCUS_LISTING_EVENT, onFocus)
    return () => {
      window.removeEventListener(MAP_FOCUS_LISTING_EVENT, onFocus)
      clearTimeout(timer)
    }
  }, [p.id])

  return (
    <article
      ref={articleRef}
      className={cn(
        'ch-card group overflow-hidden bg-white transition-shadow',
        mapFocused && 'ring-2 ring-sky-400',
        hiddenByArea && 'hidden'
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <div className="relative h-52 sm:h-auto sm:w-56 sm:shrink-0">
          <Link
            href={`/aircraft/listing/${p.id}`}
            className="relative block h-full w-full"
          >
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 208px"
            />
            {isPlaceholder && (
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                Not actual plane photo
              </span>
            )}
            {!isPlaceholder && (p.images?.length ?? 0) > 1 && (
              <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                +{p.images.length - 1} photos
              </span>
            )}
          </Link>
          {/* Favorite + watch — siblings of the photo link (not nested) for
              valid markup; mirrors the partnership card's heart. */}
          <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
            <SaveListingButton listingId={p.id} listingType="aircraft" initialSaved={saved} variant="icon" />
            <WatchAlertButton active={watchOpen} onToggle={() => setWatchOpen((v) => !v)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {source}
                </span>
                {/* Trust / completeness chip — slice 1, makes trust VISIBLE.
                    Pure read of existing columns; no ranking effect. */}
                <AircraftTrustBadge p={p} />
                <Link
                  href="/listing-quality"
                  title={`${gm.label} — ${gm.blurb}. What do these badges mean?`}
                  aria-label={`${gm.label}: ${gm.blurb}. Learn what listing badges mean`}
                  className={cn('rounded-full px-2 py-0.5 text-xs font-bold ring-1 transition-shadow hover:ring-2', gm.chip)}
                >
                  {gm.short}
                </Link>
                {drop != null && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <TrendingDown className="h-3 w-3" />
                    Price drop {formatPrice(drop)}
                  </span>
                )}
                {dealVerdict && <DealCheckChip verdict={dealVerdict} />}
                {!dealVerdict && comp && <CompPill comp={comp} />}
                {showIfrBadge
                  ? <IfrCardBadge caps={avionicsCaps} />
                  : avionicsCaps.slice(0, 2).map((cap) => (
                      <AvionicsChip key={cap.key} cap={cap} />
                    ))
                }
                {p.smoh != null && p.engine_type && (
                  <EngineTimeChip smoh={p.smoh} engineType={p.engine_type} />
                )}
                <AnnualStatusChip annualDue={p.annual_due} />
                <DamageHistoryChip damageHistory={p.damage_history} />
                {fresh && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Sparkles className="h-3 w-3" />
                    {brandNew ? 'New today' : 'New'}
                  </span>
                )}
                {isRareFind && <RareFindChip count={familyCount as number} />}
                {saveCount >= MIN_SAVES_TO_SHOW && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                    <Heart className="h-3 w-3 fill-current" />
                    Saved by {saveCount} pilots
                  </span>
                )}
                {p.registration && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {p.registration}
                  </span>
                )}
                {/* Compare toggle — only renders inside a CompareProvider (i.e.
                    on /aircraft); a no-op everywhere else. */}
                <CompareToggle listingId={p.id} label={p.title} type="aircraft" />
              </div>

              {/* Title */}
              <Link href={`/aircraft/listing/${p.id}`}>
                <h2 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-sky-700">
                  {p.title}
                </h2>
              </Link>
              <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>

              {/* Internal link to the make+model for-sale family page */}
              {family && (
                <Link
                  href={`/aircraft/${family.makeSlug}/${family.modelSlug}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  <Plane className="h-3 w-3" />
                  See all {family.make} {family.model} for sale
                </Link>
              )}

              {/* Description preview */}
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="shrink-0 rounded-xl bg-slate-50 p-3 text-right ring-1 ring-slate-100 sm:min-w-[148px]">
              {p.asking_price ? (
                <div>
                  <p className="text-xs text-slate-400">Asking</p>
                  <p className="text-2xl font-extrabold tracking-tight text-slate-900">{formatPrice(p.asking_price)}</p>
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

          {/* Watch-this-listing panel — only mounted once the bell is
              tapped (no extra render weight / DB fetch on the default grid
              render). Same `AlertSignup watchOnly` machinery as the detail
              page's watch box; `source: 'card_watch'` distinguishes this
              placement in analytics. */}
          {watchOpen && (
            <AlertSignup
              context={watchContext}
              source="card_watch"
              sourcePath={watchSourcePath}
              noun="aircraft"
              watchOnly
              className="mt-3"
            />
          )}

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {p.location ? (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="font-medium text-slate-600">{p.location}</span>
                </>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </span>
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
            {listed && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {listed}
              </span>
            )}
            {onMap && (
              <button
                type="button"
                onClick={() => focusPinFromList(p.id)}
                className="flex items-center gap-1 font-medium text-slate-500 hover:text-sky-700 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                Show on map
              </button>
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
