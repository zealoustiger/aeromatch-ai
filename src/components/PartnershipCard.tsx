'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Users, ExternalLink, LineChart, Sparkles, CalendarDays, CalendarClock, AlertTriangle, TrendingDown } from 'lucide-react'
import { Partnership } from '@/lib/types'
import { formatPrice, formatPriceK, formatShareType, aircraftLabel, cn } from '@/lib/utils'
import { getPlaceholderPhoto, pickRealPhoto } from '@/lib/aircraftPhotos'
import { track } from '@/lib/analytics'
import { classifyAvionics, computeIfrSuitability, type AvionicsCap, type IfrTier } from '@/lib/avionicsClassify'
import { lookupEngineTbo } from '@/lib/engineLife'
import { computeAnnualStatus } from '@/lib/annualStatus'
import { computeDamageHistory } from '@/lib/damageHistory'
import type { PartnershipCompVerdict, PartnershipDealCheck } from '@/lib/partnershipComps'
import SaveListingButton from './SaveListingButton'
import TrustBadge from './TrustBadge'
import CompareToggle from './CompareToggle'

// Same recipe as AircraftSaleCard's EngineTimeChip — shows hrs-to-TBO derived from
// smoh + engine_type, self-suppresses when the engine family isn't in the TBO table.
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

const AVIONICS_CHIP_STYLE: Record<string, string> = {
  glass: 'bg-violet-50 text-violet-700 ring-violet-200',
  adsb: 'bg-sky-50 text-sky-700 ring-sky-200',
  autopilot: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  waas: 'bg-sky-50 text-sky-700 ring-sky-200',
  gps: 'bg-slate-100 text-slate-600 ring-slate-200',
}

// Same recipe as AircraftSaleCard's IfrCardBadge — for "full"/"capable" tiers, show
// the one synthesized honest verdict instead of the raw equipment chips.
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

// Same recipe as AircraftSaleCard's AnnualStatusChip/DamageHistoryChip — suppresses the
// common current/clean states, only surfaces the actionable soon/overdue/reported cases.
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

// Classify avionics capabilities from the partnership description text — partnerships
// have no structured avionics[] column, so this mirrors the same phrase-split +
// classifyAvionics() recipe already used on the partnership detail page and rail card.
function partnershipAvionicsCaps(description: string | null) {
  const phrases = description
    ? description.split(/[,;\n/]+/).map((s) => s.trim()).filter(Boolean)
    : null
  return classifyAvionics(phrases)?.caps.slice(0, 2) ?? []
}

const DAY_MS = 24 * 60 * 60 * 1000

// Freshness helpers — mirror AircraftSaleCard, but keyed off `created_at`:
// user-posted partnerships have no `first_seen_at`, so days-on-market is measured
// from when the listing was created (same field the detail page uses).
function isNew(createdAt: string | null): boolean {
  if (!createdAt) return false
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return false
  return Date.now() - then < 7 * DAY_MS
}

// Redfin-style days-on-market label. Returns null when we have no usable date.
function listedAgo(createdAt: string | null): string | null {
  if (!createdAt) return null
  const then = new Date(createdAt).getTime()
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

// Confirmed price drop: we recorded a higher previous buy-in. Same recipe as
// AircraftSaleCard's priceDrop() — never fabricated, purely a recorded self-serve
// edit (see updatePartnershipListing's previous_buy_in_price/buy_in_price_changed_at).
function priceDrop(p: Partnership): number | null {
  if (p.previous_buy_in_price != null && p.buy_in_price != null && p.buy_in_price < p.previous_buy_in_price) {
    return p.previous_buy_in_price - p.buy_in_price
  }
  return null
}

// Deal Check chip — the year+hours-controlled verdict, mirrors AircraftSaleCard's
// DealCheckChip exactly. 'fair' is suppressed (no chip) to avoid noise; 'good' and
// 'high' carry signal. Wins over the plain below/above comp pill when present.
function DealCheckChip({ verdict }: { verdict: PartnershipDealCheck }) {
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

const shareColors: Record<string, string> = {
  '1/2': 'bg-violet-50 text-violet-700 ring-violet-200',
  '1/3': 'bg-sky-50 text-sky-700 ring-sky-200',
  '1/4': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  leaseback: 'bg-amber-50 text-amber-700 ring-amber-200',
  dry_lease: 'bg-slate-100 text-slate-700 ring-slate-200',
  other: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export default function PartnershipCard({
  p,
  saved = false,
  comp = null,
  dealVerdict = null,
}: {
  p: Partnership
  saved?: boolean
  /** Plain whole-family "~X% below/above market · $Xk · N comps" chip. Only rendered
   *  when `dealVerdict` is absent — the narrowed verdict takes precedence. `pct` is the
   *  whole-number percent distance from the buy-in median (always ≥1; ±5% dead-band
   *  "near" case is filtered out upstream so it never renders here). */
  comp?: PartnershipCompVerdict | null
  /** Year+hours-narrowed "Good deal"/"Priced high" verdict — wins over `comp` when set. */
  dealVerdict?: PartnershipDealCheck | null
}) {
  const aircraft = aircraftLabel(p.make, p.model, p.year)
  const shareColor = shareColors[p.share_type] ?? shareColors.other
  const realPhoto = pickRealPhoto(p.images)
  const imageUrl = realPhoto ?? getPlaceholderPhoto(p.make)
  const isPlaceholder = p.image_is_placeholder !== false && !realPhoto
  const fresh = isNew(p.created_at)
  const listed = listedAgo(p.created_at)
  const drop = priceDrop(p)
  const avionicsCaps = partnershipAvionicsCaps(p.description)
  const ifrTier = computeIfrSuitability(avionicsCaps)?.tier ?? null
  const showIfrBadge = ifrTier === 'full' || ifrTier === 'capable'

  return (
    <article className="ch-card group overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row">

        {/* Photo */}
        <div className="relative sm:w-56 sm:shrink-0">
          <Link href={`/partnerships/${p.id}`} className="relative block h-52 sm:h-full">
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
          {/* Favorite — sibling of the Link (not nested) for valid markup */}
          <div className="absolute right-2 top-2 z-10">
            <SaveListingButton listingId={p.id} initialSaved={saved} variant="icon" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', shareColor)}>
                  {formatShareType(p.share_type)}
                </span>
                {fresh && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Sparkles className="h-3 w-3" />
                    New
                  </span>
                )}
                {p.registration && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600 ring-1 ring-slate-200">
                    {p.registration}
                  </span>
                )}
                <TrustBadge p={p} variant="compact" />
                {p.smoh != null && p.engine_type && (
                  <EngineTimeChip smoh={p.smoh} engineType={p.engine_type} />
                )}
                <AnnualStatusChip annualDue={p.annual_due} />
                <DamageHistoryChip damageHistory={p.damage_history} />
                {drop != null && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <TrendingDown className="h-3 w-3" />
                    Price drop {formatPrice(drop)}
                  </span>
                )}
                {showIfrBadge
                  ? <IfrCardBadge caps={avionicsCaps} />
                  : avionicsCaps.map((cap) => (
                      <span
                        key={cap.key}
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                          AVIONICS_CHIP_STYLE[cap.key] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
                        )}
                        title={cap.hint}
                      >
                        {cap.label}
                      </span>
                    ))
                }
                {dealVerdict && <DealCheckChip verdict={dealVerdict} />}
                {!dealVerdict && comp?.kind === 'below' && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    title={`vs. expected buy-in for this share size (${formatPrice(comp.median)})`}
                  >
                    <LineChart className="h-3 w-3" />
                    ~{comp.pct}% below market · {formatPriceK(comp.median)} · {comp.count} comps
                  </span>
                )}
                {!dealVerdict && comp?.kind === 'above' && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                    title={`vs. expected buy-in for this share size (${formatPrice(comp.median)})`}
                  >
                    <LineChart className="h-3 w-3" />
                    ~{comp.pct}% above market · {formatPriceK(comp.median)} · {comp.count} comps
                  </span>
                )}
                {/* Compare toggle — only renders inside a CompareProvider (i.e.
                    on /partnerships); a no-op everywhere else. */}
                <CompareToggle listingId={p.id} label={p.title} type="partnership" />
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
            <div className="shrink-0 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:min-w-[148px] sm:text-right">
              <div className="flex flex-wrap gap-x-4 gap-y-1 sm:block">
                {p.buy_in_price ? (
                  <div className="sm:block">
                    <p className="text-xs text-slate-400">Buy-in</p>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">{formatPrice(p.buy_in_price)}</p>
                    {drop != null && (
                      <p className="text-xs text-slate-400 line-through">{formatPrice(p.previous_buy_in_price)}</p>
                    )}
                  </div>
                ) : null}
                {p.monthly_fixed ? (
                  <div className="sm:mt-1">
                    <p className="text-xs text-slate-400">Monthly</p>
                    <p className="text-sm font-semibold text-slate-700">{formatPrice(p.monthly_fixed)}/mo</p>
                  </div>
                ) : null}
                {p.hourly_wet ? (
                  <div className="sm:mt-1">
                    <p className="text-xs text-slate-400">Wet rate</p>
                    <p className="text-sm font-semibold text-slate-700">{formatPrice(p.hourly_wet)}/hr</p>
                  </div>
                ) : null}
                {!p.buy_in_price && !p.monthly_fixed && (
                  <p className="text-sm text-slate-400">Contact for pricing</p>
                )}
              </div>
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
            {listed && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {listed}
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
