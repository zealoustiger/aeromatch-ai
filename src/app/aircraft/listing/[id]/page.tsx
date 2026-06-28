import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  ExternalLink,
  Gauge,
  Wrench,
  Calendar,
  Plane,
  Cpu,
  Radio,
  ShieldAlert,
  Clock,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Scale,
  AlertTriangle,
  ArrowRight,
  Users,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAircraftForSaleById, getFamilyAskingPrices, getFamilyComps } from '@/lib/aircraftForSale'
import { getPartnershipCrossSell } from '@/lib/partnershipsQuery'
import { computeEngineLife, type EngineLifeResult } from '@/lib/engineLife'
import { classifyAvionics, type AvionicsInfo } from '@/lib/avionicsClassify'
import {
  clubHangerEstimate,
  clubHangerDealVerdict,
  type ClubHangerEstimate,
  type ClubHangerDealVerdict,
} from '@/lib/aircraftEstimate'
import { estimateShareCosts } from '@/lib/calculators'
import { AircraftForSale } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, resolveMakeModelFamily } from '@/lib/seo'
import { gradeFromScore, gradeMeta } from '@/lib/listingQuality'
import { pickRealPhoto } from '@/lib/aircraftPhotos'
import { buildAircraftListingJsonLd } from '@/lib/aircraftJsonLd'
import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs'
import PhotoGallery from '@/components/PhotoGallery'
import SaveListingButton from '@/components/SaveListingButton'
import ShareListingButton from '@/components/ShareListingButton'
import SimilarAircraft from '@/components/SimilarAircraft'
import SavedListingNote from '@/components/SavedListingNote'
import ListingCompletenessPanel from '@/components/ListingCompletenessPanel'
import AircraftContactButton from '@/components/AircraftContactButton'
import ShareCostPanel from '@/components/ShareCostPanel'

const DAY_MS = 86_400_000

// ─── Deal Score — "How this stacks up" synthesis panel ───────────────────────
// Synthesizes the buyer-relevant signals already computed on this page
// (price positioning, days on market, price history, spec completeness) into
// one scannable card. No composite number — shows transparent reasons only.

type DealSignalKind = 'positive' | 'neutral' | 'negative'

interface DealSignalRow {
  kind: DealSignalKind
  label: string
  detail: string
}

function computeDealSignals(
  p: AircraftForSale,
  estimate: ClubHangerEstimate | null,
  dealVerdict: ClubHangerDealVerdict | null,
): DealSignalRow[] {
  const rows: DealSignalRow[] = []
  const makeModel = [p.make, p.model].filter(Boolean).join(' ')

  // 1. Price positioning — prefer deal verdict (year+hours controlled), fall back to estimate
  if (dealVerdict) {
    const absDelta = formatPrice(Math.abs(dealVerdict.deltaDollars))
    const dir = dealVerdict.deltaDollars < 0 ? 'below' : 'above'
    if (dealVerdict.verdict === 'good') {
      rows.push({
        kind: 'positive',
        label: 'Good deal',
        detail: `${absDelta} (${dealVerdict.deltaPct}%) ${dir} the median of ${dealVerdict.compCount} similar-year, similar-hours${makeModel ? ` ${makeModel}` : ''} listings`,
      })
    } else if (dealVerdict.verdict === 'fair') {
      rows.push({
        kind: 'neutral',
        label: 'Fair price',
        detail: `Near the going rate for similar-year, similar-hours${makeModel ? ` ${makeModel}` : ''} listings (${dealVerdict.compCount} comps)`,
      })
    } else {
      rows.push({
        kind: 'negative',
        label: 'Priced high',
        detail: `${absDelta} (${dealVerdict.deltaPct}%) ${dir} the median of ${dealVerdict.compCount} similar-year, similar-hours${makeModel ? ` ${makeModel}` : ''} listings`,
      })
    }
  } else if (estimate) {
    const absDelta = formatPrice(Math.abs(estimate.deltaDollars))
    const dir = estimate.deltaDollars < 0 ? 'below' : 'above'
    if (estimate.verdict === 'below') {
      rows.push({
        kind: 'positive',
        label: 'Below market',
        detail: `${absDelta} (${estimate.deltaPct}%) ${dir} the family-wide median of ${estimate.compCount}${makeModel ? ` ${makeModel}` : ''} listings (year & hours not controlled)`,
      })
    } else if (estimate.verdict === 'around') {
      rows.push({
        kind: 'neutral',
        label: 'Around market',
        detail: `Near the family-wide median asking price of ${estimate.compCount}${makeModel ? ` ${makeModel}` : ''} listings`,
      })
    } else {
      rows.push({
        kind: 'negative',
        label: 'Above market',
        detail: `${absDelta} (${estimate.deltaPct}%) ${dir} the family-wide median of ${estimate.compCount}${makeModel ? ` ${makeModel}` : ''} listings`,
      })
    }
  }

  // 2. Days on market
  if (p.first_seen_at) {
    const days = Math.floor((Date.now() - new Date(p.first_seen_at).getTime()) / DAY_MS)
    if (days >= 90) {
      const months = Math.floor(days / 30)
      rows.push({
        kind: 'positive',
        label: `Listed ${months} months ago`,
        detail: 'Long listing cycle — seller may have flexibility on price',
      })
    } else if (days >= 30) {
      const months = Math.floor(days / 30)
      rows.push({
        kind: 'neutral',
        label: `Listed ${months} month${months > 1 ? 's' : ''} ago`,
        detail: 'On the market for a month or more — worth asking about negotiating room',
      })
    } else if (days <= 3) {
      rows.push({
        kind: 'neutral',
        label: days === 0 ? 'Listed today' : `Listed ${days} day${days === 1 ? '' : 's'} ago`,
        detail: 'Fresh to market — early in the listing cycle',
      })
    } else {
      rows.push({
        kind: 'neutral',
        label: `Listed ${days} days ago`,
        detail: 'Relatively recently listed',
      })
    }
  }

  // 3. Price history — only when a real recorded change exists
  if (p.previous_price != null && p.asking_price != null && p.previous_price !== p.asking_price) {
    const delta = p.asking_price - p.previous_price
    const pct = Math.abs(Math.round((delta / p.previous_price) * 100))
    if (delta < 0) {
      rows.push({
        kind: 'positive',
        label: `Price reduced ${formatPrice(Math.abs(delta))}`,
        detail: `Down ${pct}% from the original ${formatPrice(p.previous_price)} — a seller motivation signal`,
      })
    } else {
      rows.push({
        kind: 'negative',
        label: `Price increased ${formatPrice(delta)}`,
        detail: `Up ${pct}% from ${formatPrice(p.previous_price)}`,
      })
    }
  }

  // 4. Spec completeness — key buyer-evaluation fields
  const keyPresent = [
    p.year != null,
    p.ttaf != null,
    p.smoh != null,
    !!p.engine_type,
    !!p.registration?.trim(),
  ].filter(Boolean).length
  const keyTotal = 5
  if (keyPresent === keyTotal) {
    rows.push({
      kind: 'positive',
      label: 'Well documented',
      detail: `All ${keyTotal} key fields (year, total time, engine hours, engine type, registration) are provided`,
    })
  } else if (keyPresent >= 3) {
    rows.push({
      kind: 'neutral',
      label: `${keyPresent}/${keyTotal} key specs`,
      detail: 'Most key specs are provided; verify any missing details with the seller',
    })
  } else {
    rows.push({
      kind: 'negative',
      label: `${keyPresent}/${keyTotal} key specs`,
      detail: 'Key information is missing — ask the seller about hours, engine time, and registration',
    })
  }

  return rows
}

// Human-friendly labels for known aggregation sources (mirrors AircraftSaleCard).
const SOURCE_LABELS: Record<string, string> = {
  barnstormers: 'Barnstormers',
  hangar67: 'Hangar67',
  aircraftforsale: 'AircraftForSale',
  globalplanesearch: 'GlobalPlaneSearch',
  'trade-a-plane': 'Trade-A-Plane',
  controller: 'Controller',
  user: 'Listed here',
}
const sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s

// "Year Make Model" label, falling back to the listing title.
function aircraftLabel(p: AircraftForSale): string {
  const parts = [p.year, p.make, p.model].filter(Boolean)
  return parts.length ? parts.join(' ') : p.title
}

// Redfin-style days-on-market from first_seen_at; null when unknown.
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

function priceDrop(p: AircraftForSale): number | null {
  if (p.previous_price != null && p.asking_price != null && p.asking_price < p.previous_price) {
    return p.previous_price - p.asking_price
  }
  return null
}

// Readable absolute date ("Apr 12, 2026"); null when unparseable/missing.
function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return null
  return t.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n)
  )

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = await getAircraftForSaleById(id)
  if (!p) return { title: 'Listing not found' }

  const label = aircraftLabel(p)
  const priceBit = p.asking_price ? ` — ${formatPrice(p.asking_price)}` : ''
  const title = `${label} for sale${priceBit} | ${SITE_NAME}`
  const description =
    p.description?.slice(0, 155) ??
    `${label} for sale${p.location ? ` in ${p.location}` : ''}${
      p.asking_price ? ` — asking ${formatPrice(p.asking_price)}` : ''
    }. Full specs, photos, and source listing on ClubHanger.`

  const url = `${SITE_URL}/aircraft/listing/${p.id}`
  // Real harvested photo when present; else the site default so a shared link
  // always unfurls into something real, never a broken/empty image.
  const realPhoto = pickRealPhoto(p.images)
  const ogImage = realPhoto ?? DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: label }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function AircraftListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = searchParams ? await searchParams : {}
  const justPosted = sp.posted === '1'
  const p = await getAircraftForSaleById(id)
  if (!p) notFound()

  // Fetch the current user's saved row for this listing so we can:
  // (a) pass the real initialSaved state (eliminates the heart-state flash), and
  // (b) render the note editor if the user has saved this listing.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let savedRowId: string | null = null
  let savedNote: string | null = null
  let notesEnabled = false

  if (user) {
    // Try to select with the note column; fall back gracefully when the column
    // hasn't been migrated yet (same pattern as the /saved page).
    const withNote = await supabase
      .from('saved_listings')
      .select('id, note')
      .eq('user_id', user.id)
      .eq('listing_id', p.id)
      .eq('listing_type', 'aircraft')
      .maybeSingle()

    if (!withNote.error) {
      notesEnabled = true
      savedRowId = withNote.data?.id ?? null
      savedNote = withNote.data?.note ?? null
    } else {
      // note column not yet migrated (42703) or other error — id-only fallback.
      const fallback = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', p.id)
        .eq('listing_type', 'aircraft')
        .maybeSingle()
      savedRowId = fallback.data?.id ?? null
    }
  }

  const label = aircraftLabel(p)
  const source = sourceLabel(p.source)
  const isExternal = p.source !== 'user'
  const family = resolveMakeModelFamily(p.make, p.model)
  const grade = gradeFromScore(p.quality_score)
  const gm = gradeMeta(grade)
  const drop = priceDrop(p)
  const fresh = p.first_seen_at != null && Date.now() - new Date(p.first_seen_at).getTime() < 7 * DAY_MS
  const listed = listedAgo(p.first_seen_at)


  // ClubHanger Estimate — this listing's asking price vs. the median of OTHER active
  // priced listings in the same make+model family (Zillow-Zestimate analog). Only
  // computed when we have a real price AND the listing resolves to a known family;
  // the pure helper returns null on thin comp sets, so the block self-suppresses.
  // ClubHanger Deal Check — the endorsement-style "good deal / fair / priced high"
  // verdict, honest because it compares only against similar-year + similar-hours
  // comps (the helper returns null on thin/uncontrolled data, so it self-suppresses).
  // Both family reads run concurrently and only when there's a real price + family.
  const [familyPrices, familyComps] =
    p.asking_price && family
      ? await Promise.all([
          getFamilyAskingPrices(family.make, family.modelPattern, family.notModelPattern),
          getFamilyComps(family.make, family.modelPattern, family.notModelPattern, p.id),
        ])
      : [[], []]
  const estimate =
    p.asking_price && family ? clubHangerEstimate(p.asking_price, familyPrices) : null
  const dealVerdict =
    p.asking_price && family
      ? clubHangerDealVerdict({ askingPrice: p.asking_price, year: p.year, ttaf: p.ttaf }, familyComps)
      : null
  const familyLabel = family ? `${family.make} ${family.model}` : null

  // Co-ownership cross-sell: how many active ClubHanger partnerships match this
  // make/model. Tries model-level first (e.g. "3 Cessna 172 partnerships"); falls
  // back to make-level ("6 Cessna partnerships") when no model match is found.
  // Self-suppresses (returns null) when make is unknown or no partnerships found.
  const crossSell = p.make ? await getPartnershipCrossSell(p.make, p.model) : null

  // Structured data — a single Product/Offer for this listing. Real harvested
  // photo only (never our per-make placeholder or the site-logo OG fallback).
  const detailUrl = `${SITE_URL}/aircraft/listing/${p.id}`
  const realPhoto = p.image_is_placeholder ? null : pickRealPhoto(p.images)
  const productJsonLd = buildAircraftListingJsonLd(p, { url: detailUrl, image: realPhoto })

  // Crawlable breadcrumb trail (Home › Planes for Sale › family › this listing);
  // the shared component also emits BreadcrumbList JSON-LD.
  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Planes for Sale', href: '/aircraft' },
    ...(family
      ? [{ label: `${family.make} ${family.model}`, href: `/aircraft/${family.makeSlug}/${family.modelSlug}` }]
      : []),
    { label },
  ]

  // Price history — render only when a real recorded change exists (no fabrication).
  const changedFrom =
    p.previous_price != null && p.asking_price != null && p.previous_price !== p.asking_price
      ? p.previous_price
      : null
  const priceDelta = changedFrom != null ? p.asking_price! - changedFrom : null
  const pricePct = changedFrom ? Math.round((priceDelta! / changedFrom) * 100) : null
  const changedDate = formatDate(p.price_changed_at)
  const listedDate = formatDate(p.first_seen_at)

  // Engine life & overhaul reserve — proprietary panel using extracted smoh +
  // engine_type. Self-suppresses (returns null) when either field is missing or the
  // engine type can't be matched to a known piston-GA TBO family.
  const engineLife = computeEngineLife({ smoh: p.smoh, engineType: p.engine_type })

  // Avionics capability classification — converts the raw extracted avionics[]
  // string list into structured capability chips (Glass Panel, ADS-B Out, Autopilot,
  // WAAS GPS). Self-suppresses when avionics is null or empty.
  const avionicsInfo = classifyAvionics(p.avionics)

  // Cost-to-own breakdown — sole ownership vs. 1/2, 1/3, 1/4 partnership shares.
  // Engine reserve is folded into fixed costs when the Engine Life panel is showing,
  // keeping both panels numerically consistent.
  const shareCosts = p.asking_price
    ? estimateShareCosts(p.asking_price, engineLife?.reservePerYear ?? 0)
    : null

  // Deal Score synthesis — "How this stacks up" panel in the main column.
  // Computes from already-fetched data only; no new DB reads.
  const dealSignalRows = computeDealSignals(p, estimate, dealVerdict)

  // Spec rows — only the fields we actually have; missing ones are omitted so the
  // grid never shows a "null"/empty row.
  const specs: { icon: ReactNode; label: string; value: string }[] = []
  if (p.year) specs.push({ icon: <Calendar className="h-4 w-4 text-slate-400" />, label: 'Year', value: String(p.year) })
  if (p.ttaf != null) specs.push({ icon: <Gauge className="h-4 w-4 text-slate-400" />, label: 'Total time (TTAF)', value: `${p.ttaf.toLocaleString()} hrs` })
  if (p.smoh != null) specs.push({ icon: <Wrench className="h-4 w-4 text-slate-400" />, label: 'Engine time (SMOH)', value: `${p.smoh.toLocaleString()} hrs` })
  if (p.engine_type) specs.push({ icon: <Cpu className="h-4 w-4 text-slate-400" />, label: 'Engine', value: p.engine_type })
  if (p.annual_due) specs.push({ icon: <Calendar className="h-4 w-4 text-slate-400" />, label: 'Annual due', value: p.annual_due })
  if (p.damage_history != null) specs.push({ icon: <ShieldAlert className="h-4 w-4 text-slate-400" />, label: 'Damage history', value: p.damage_history ? 'Yes' : 'None reported' })

  return (
    <div className="ch-surface min-h-screen">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Crawlable breadcrumb trail (also emits BreadcrumbList JSON-LD). */}
        <Breadcrumbs items={crumbs} />

        {/* Post-success confirmation — shown once when redirected from the post form */}
        {justPosted && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="font-semibold text-emerald-800">Your listing is live!</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Buyers can now find and message you about {p.title}.{' '}
              <a href="/listings" className="font-medium underline hover:text-emerald-900">
                View all my listings →
              </a>
            </p>
          </div>
        )}

        {/* Save / share + optional user note on this saved listing */}
        <div className="mb-6">
          <div className="flex items-center justify-end gap-2">
            <ShareListingButton url={detailUrl} />
            <SaveListingButton listingId={p.id} listingType="aircraft" initialSaved={!!savedRowId} variant="full" />
          </div>
          {notesEnabled && savedRowId && (
            <SavedListingNote savedRowId={savedRowId} note={savedNote} />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <PhotoGallery
              images={p.images}
              make={p.make ?? ''}
              alt={label}
              imageIsPlaceholder={p.image_is_placeholder}
            />

            <div className="ch-panel p-6">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {source}
                </span>
                <Link
                  href="/listing-quality"
                  title={`${gm.label} — ${gm.blurb}. What do these badges mean?`}
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 transition-shadow hover:ring-2 ${gm.chip}`}
                >
                  {gm.short}
                </Link>
                {drop != null && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <TrendingDown className="h-3 w-3" /> Price drop {formatPrice(drop)}
                  </span>
                )}
                {fresh && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Sparkles className="h-3 w-3" /> New
                  </span>
                )}
                {p.registration && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {p.registration}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
              <p className="mt-1 text-lg font-medium text-slate-500">{label}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                {p.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">{p.location}</span>
                  </span>
                )}
                {listed && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" /> {listed}
                  </span>
                )}
              </div>

              {/* Internal link to the make+model family page when one exists. */}
              {family && (
                <Link
                  href={`/aircraft/${family.makeSlug}/${family.modelSlug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  <Plane className="h-4 w-4" /> See all {family.make} {family.model} for sale
                </Link>
              )}

              {p.description && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About this aircraft</h2>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">{p.description}</p>
                </div>
              )}
            </div>

            {/* Specifications */}
            {specs.length > 0 && (
              <div className="ch-panel p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Specifications</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt className="text-xs text-slate-400">{s.label}</dt>
                      <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
                        {s.icon} {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Avionics & panel — structured capability chips + full equipment list.
                Self-suppresses when no avionics data was extracted from the description. */}
            {avionicsInfo && <AvionicsPanel info={avionicsInfo} />}

            {/* Deal Score — "How this stacks up" synthesis: price positioning,
                days on market, price history, spec completeness. Self-suppresses
                when fewer than 2 actionable signals are available. */}
            <DealScorePanel rows={dealSignalRows} />

            {/* Engine life & overhaul reserve — renders only when smoh + engine_type
                are present AND the engine type is a recognised piston-GA family. */}
            {engineLife && <EngineLifePanel life={engineLife} />}

            {/* Price history — only when a real recorded change exists. */}
            {changedFrom != null && priceDelta != null && (
              <div className="ch-panel p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Price history</h2>
                <ol className="space-y-3">
                  {changedDate && (
                    <li className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        {priceDelta < 0 ? (
                          <TrendingDown className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                        )}
                        Price {priceDelta < 0 ? 'reduced' : 'increased'}
                        <span className="text-slate-400">· {changedDate}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold text-slate-900">{formatPrice(p.asking_price)}</span>
                        <span
                          className={`text-xs font-medium ${priceDelta < 0 ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {priceDelta < 0 ? '−' : '+'}
                          {formatPrice(Math.abs(priceDelta))}
                          {pricePct != null && ` (${priceDelta < 0 ? '' : '+'}${pricePct}%)`}
                        </span>
                      </span>
                    </li>
                  )}
                  <li className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {listedDate ? `Listed · ${listedDate}` : 'Originally listed'}
                    </span>
                    <span className="font-medium text-slate-400 line-through">{formatPrice(changedFrom)}</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Cost to own — sole vs. partnership share breakdown.
                Fixed costs (insurance, hangar, annual, engine reserve) split by N;
                operating stays the same since each partner flies the same hours. */}
            {shareCosts && <ShareCostPanel rows={shareCosts} withEngineReserve={!!engineLife} />}
          </div>

          {/* Sidebar — price + source CTA */}
          <div className="min-w-0 space-y-4">
            <div className="ch-panel p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Price</h2>
              {p.asking_price ? (
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">{formatPrice(p.asking_price)}</p>
                  {drop != null && (
                    <p className="mt-1 text-sm text-slate-400 line-through">{formatPrice(p.previous_price)}</p>
                  )}
                </div>
              ) : p.price_text ? (
                <p className="text-lg font-semibold capitalize text-slate-700">{p.price_text}</p>
              ) : (
                <p className="text-sm text-slate-400">Contact seller for price</p>
              )}
            </div>

            {/* ClubHanger Estimate — price vs. the same-family median. Renders only
                when there's a real price and enough same-family comps. */}
            {estimate && familyLabel && (
              <EstimatePanel
                estimate={estimate}
                deal={dealVerdict}
                familyLabel={familyLabel}
                familyHref={
                  family ? `/aircraft/${family.makeSlug}/${family.modelSlug}` : undefined
                }
              />
            )}

            {/* Co-ownership cross-sell — surface partnership alternatives when active
                ClubHanger shares exist for the same make. Proprietary: no other listing
                site shows you co-ownership options alongside a for-sale listing. */}
            {crossSell && p.make && (
              <PartnershipCrossSellPanel
                make={p.make}
                model={crossSell.modelLevel ? (p.model ?? null) : null}
                count={crossSell.count}
                minBuyIn={crossSell.minBuyIn}
              />
            )}

            {/* Listing completeness — shows buyers which key signals are present. */}
            <ListingCompletenessPanel p={p} />

            {/* Contact CTA — for user-posted aircraft with a poster, show Message button;
                for scraped listings, show the outbound source link. */}
            {p.source === 'user' && p.poster_id ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-800">Contact the seller</h2>
                <p className="mb-3 text-sm text-slate-500">
                  This aircraft is listed directly on ClubHanger. Message the seller to ask questions or arrange a viewing.
                </p>
                <AircraftContactButton
                  aircraftId={p.id}
                  posterId={p.poster_id}
                  listingPath={`/aircraft/listing/${p.id}`}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-sky-800">View the original listing</h2>
                <p className="mb-3 text-sm text-sky-700">
                  This aircraft is listed on {source}. Contact and full details are on the source site.
                </p>
                {p.source_url ? (
                  <a
                    href={p.source_url}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
                  >
                    {isExternal ? `View on ${source}` : 'View listing'} <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-sm text-sky-700">No source link available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar aircraft — real other same-make active listings, each a
            crawlable internal link to its own detail page. Renders nothing when
            there are no sensible matches. */}
        <div className="mt-10">
          <SimilarAircraft current={p} />
        </div>
      </div>
    </div>
  )
}

function EngineLifePanel({ life }: { life: EngineLifeResult }) {
  const pct = Math.max(0, Math.min(100, Math.round((life.remainingHours / life.tboHours) * 100)))
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Wrench className="h-4 w-4" /> Engine Life
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Based on {life.smoh.toLocaleString()} hrs since overhaul (SMOH) and the published{' '}
        {life.tboHours.toLocaleString()} hr TBO for the {life.family}.
      </p>

      {life.beyondTbo ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Engine is beyond published TBO</p>
            <p className="mt-0.5 text-sm text-amber-700">
              This engine has {Math.abs(life.remainingHours).toLocaleString()} hrs past the{' '}
              {life.tboHours.toLocaleString()} hr TBO. Ask the seller about the engine
              inspection history and any overhauled-beyond-TBO authorization.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {life.remainingHours.toLocaleString()} hrs
            </span>
            <span className="text-sm text-slate-500">to TBO</span>
          </div>
          {/* Progress bar — remaining / TBO */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${pct > 40 ? 'bg-emerald-400' : pct > 15 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{pct}% of TBO remaining</p>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-500">Engine reserve budget</span>
          <span className="font-semibold text-slate-800">
            ~{money(life.reservePerYear)}/yr · ~{money(life.reservePerHour)}/hr
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Estimated overhaul cost ({money(life.overhaulCostUsd)}) spread over{' '}
          {life.tboHours.toLocaleString()} hr TBO at 100 hrs/yr — a rule of thumb, not a quote.
        </p>
      </div>
    </div>
  )
}

const CAP_COLORS: Record<string, string> = {
  glass: 'bg-violet-50 text-violet-700 ring-violet-200',
  adsb: 'bg-sky-50 text-sky-700 ring-sky-200',
  autopilot: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  waas: 'bg-sky-50 text-sky-700 ring-sky-200',
  gps: 'bg-slate-100 text-slate-700 ring-slate-200',
}

function AvionicsPanel({ info }: { info: AvionicsInfo }) {
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Radio className="h-4 w-4" /> Avionics & panel
      </h2>

      {info.caps.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {info.caps.map((cap) => (
            <span
              key={cap.key}
              title={cap.hint}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CAP_COLORS[cap.key] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
            >
              {cap.label}
            </span>
          ))}
        </div>
      )}

      <ul className="grid gap-x-4 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
        {info.items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        Equipment list extracted from the seller's description. Verify with logbooks before purchase.
      </p>
    </div>
  )
}


function EstRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

// Per-verdict presentation for the ClubHanger Estimate badge + headline. The label
// is a DESCRIPTIVE market comparison (below / around / above the family median), not
// an endorsement — the comp set is the whole make+model family, so a gap can reflect
// year/hours/avionics rather than a bargain (see the caveat line below).
const ESTIMATE_META: Record<
  ClubHangerEstimate['verdict'],
  { label: string; chip: string; Icon: typeof TrendingDown }
> = {
  below: {
    label: 'Below market',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: TrendingDown,
  },
  around: {
    label: 'Around market',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    Icon: Scale,
  },
  above: {
    label: 'Above market',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: TrendingUp,
  },
}

// Per-verdict presentation for the ClubHanger Deal Check. Unlike the descriptive
// family-median estimate above, this IS a value judgement — earned by comparing only
// against similar-year + similar-hours comps (see `clubHangerDealVerdict`).
const DEAL_META: Record<
  ClubHangerDealVerdict['verdict'],
  { label: string; chip: string; Icon: typeof TrendingDown }
> = {
  good: {
    label: 'Good deal',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Icon: TrendingDown,
  },
  fair: {
    label: 'Fair price',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    Icon: Scale,
  },
  high: {
    label: 'Priced high',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: TrendingUp,
  },
}

function DealCheck({ deal, familyLabel }: { deal: ClubHangerDealVerdict; familyLabel: string }) {
  const meta = DEAL_META[deal.verdict]
  const dir = deal.deltaDollars < 0 ? 'below' : 'above'
  const sentence =
    deal.verdict === 'fair'
      ? `Right around the going rate for similar-year, similar-hours ${familyLabel} listings.`
      : `Asking ${formatPrice(Math.abs(deal.deltaDollars))} (${deal.deltaPct}%) ${dir} the median of similar-year, similar-hours ${familyLabel} listings.`
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Deal check</p>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ${meta.chip}`}
      >
        <meta.Icon className="h-4 w-4" /> {meta.label}
      </span>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">{sentence}</p>
      <p className="mt-2 text-xs text-slate-500">
        Compared with {deal.compCount} {familyLabel} listing{deal.compCount === 1 ? '' : 's'} for sale
        now within ±{deal.yearBand} years and comparable total time — controlling for the two biggest
        value drivers, so this is a genuine value read (median {formatPrice(deal.median)}).
      </p>
    </div>
  )
}

function EstimatePanel({
  estimate,
  deal,
  familyLabel,
  familyHref,
}: {
  estimate: ClubHangerEstimate
  deal?: ClubHangerDealVerdict | null
  familyLabel: string
  familyHref?: string
}) {
  const meta = ESTIMATE_META[estimate.verdict]
  const dir = estimate.deltaDollars < 0 ? 'below' : 'above'
  const headline =
    estimate.verdict === 'around'
      ? `Asking price is around the median for ${familyLabel} listings.`
      : `Asking ${formatPrice(Math.abs(estimate.deltaDollars))} (${estimate.deltaPct}%) ${dir} the median ${familyLabel} listing.`

  // Visual low–high spread bar — only when there's a real range (high > low).
  // Positions derive purely from values already shown: the comp low/high/median and
  // this listing's own asking price (recovered as median + signed delta). The subject's
  // own price is excluded from the comp set, so it can fall at/beyond an endpoint —
  // clamp the marker to the track (consistent with the "priced below/above all" copy).
  const hasRange = estimate.high > estimate.low
  const askingPrice = estimate.median + estimate.deltaDollars
  const onBar = (value: number) =>
    Math.max(0, Math.min(100, ((value - estimate.low) / (estimate.high - estimate.low)) * 100))
  const medianPos = onBar(estimate.median)
  const subjectPos = onBar(askingPrice)

  return (
    <div className="ch-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Scale className="h-4 w-4" /> ClubHanger Estimate
      </h2>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ${meta.chip}`}
      >
        <meta.Icon className="h-4 w-4" /> {meta.label}
      </span>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">{headline}</p>
      <p className="mt-2 text-xs text-slate-500">
        {estimate.high > estimate.low ? (
          <>
            {estimate.compCount} other {familyLabel} listing{estimate.compCount === 1 ? '' : 's'} for
            sale now range {formatPrice(estimate.low)}–{formatPrice(estimate.high)} (median{' '}
            {formatPrice(estimate.median)}) — this one is{' '}
            {estimate.percentile === 0
              ? 'priced below all of them'
              : estimate.percentile === 100
                ? 'priced above all of them'
                : `priced above ${estimate.percentile}% of them`}
            .
          </>
        ) : (
          <>
            Based on the median asking price ({formatPrice(estimate.median)}) of {estimate.compCount}{' '}
            other {familyLabel} listing{estimate.compCount === 1 ? '' : 's'} for sale now.
          </>
        )}
      </p>
      {hasRange && (
        <div className="mt-3">
          <div
            className="relative h-2 rounded-full bg-gradient-to-r from-emerald-200 via-slate-200 to-amber-200"
            role="img"
            aria-label={`This listing is priced ${
              estimate.percentile === 0
                ? 'below all'
                : estimate.percentile === 100
                  ? 'above all'
                  : `above ${estimate.percentile}% of`
            } comparable ${familyLabel} listings, which range ${formatPrice(estimate.low)} to ${formatPrice(
              estimate.high
            )} (median ${formatPrice(estimate.median)}).`}
          >
            {/* median tick */}
            <div
              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-400"
              style={{ left: `${medianPos}%` }}
            />
            {/* this listing */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 shadow"
              style={{ left: `${subjectPos}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>{formatPrice(estimate.low)}</span>
            <span>{formatPrice(estimate.high)}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-sky-600 shadow-sm" />
              this listing
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-0.5 rounded bg-slate-400" />
              median
            </span>
          </div>
        </div>
      )}
      {deal && <DealCheck deal={deal} familyLabel={familyLabel} />}
      {familyHref && (
        <Link
          href={familyHref}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          See all {familyLabel} for sale <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Compares this asking price to all {familyLabel} listings — actual value also depends on
        year, hours, and avionics. An estimate, not an appraisal or an offer.
      </p>
    </div>
  )
}

// ─── Deal Score Panel ────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<DealSignalKind, { dot: string; label: string }> = {
  positive: { dot: 'bg-emerald-400', label: 'text-emerald-700' },
  neutral:  { dot: 'bg-slate-300',   label: 'text-slate-700'   },
  negative: { dot: 'bg-amber-400',   label: 'text-amber-700'   },
}

// ─── Partnership Cross-Sell Panel ────────────────────────────────────────────

function PartnershipCrossSellPanel({
  make,
  model,
  count,
  minBuyIn,
}: {
  make: string
  model: string | null
  count: number
  minBuyIn: number | null
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const makeEncoded = encodeURIComponent(make)
  const label = model ? `${make} ${model}` : make
  const ctaHref = model
    ? `/partnerships?make=${makeEncoded}&model=${encodeURIComponent(model)}`
    : `/partnerships?make=${makeEncoded}`
  return (
    <div className="ch-panel p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Users className="h-4 w-4" /> Co-ownership available
      </h2>
      <p className="text-sm font-medium text-slate-800">
        {count === 1 ? '1 co-ownership share' : `${count} co-ownership shares`} listed for{' '}
        {label} aircraft on ClubHanger.
      </p>
      {minBuyIn != null && (
        <p className="mt-1 text-sm text-slate-500">
          From <span className="font-semibold text-slate-700">{fmt(minBuyIn)}</span> buy-in — split the fixed costs with a partner instead of owning outright.
        </p>
      )}
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        Browse {label} partnerships <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function DealScorePanel({ rows }: { rows: DealSignalRow[] }) {
  if (rows.length < 2) return null
  // At-a-glance tally — counts ONLY the signals already listed below; neutral/context
  // rows are excluded so the summary never overstates the case either way. No score,
  // no new claim — purely a synthesis of the honest rows the panel already shows.
  const favorable = rows.filter((r) => r.kind === 'positive').length
  const watchOuts = rows.filter((r) => r.kind === 'negative').length
  const summary: { text: string; chip: string }[] = []
  if (favorable > 0)
    summary.push({
      text: `${favorable} in this listing's favor`,
      chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    })
  if (watchOuts > 0)
    summary.push({
      text: `${watchOuts} to ask about`,
      chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    })
  return (
    <div className="ch-panel p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        How this stacks up
      </h2>
      {summary.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {summary.map((s) => (
            <span
              key={s.text}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${s.chip}`}
            >
              {s.text}
            </span>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((row, i) => {
          const { dot, label } = SIGNAL_COLORS[row.kind]
          return (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
              <div>
                <p className={`text-sm font-semibold ${label}`}>{row.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{row.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        This summary draws on signals shown in detail below — price comps, listing age, and key specs.
        Read each section for full context. Not an appraisal.
      </p>
    </div>
  )
}
