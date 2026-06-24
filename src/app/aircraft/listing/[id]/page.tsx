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
  Wallet,
  ArrowRight,
  Scale,
} from 'lucide-react'
import { getAircraftForSaleById, getFamilyAskingPrices, getFamilyComps } from '@/lib/aircraftForSale'
import {
  clubHangerEstimate,
  clubHangerDealVerdict,
  type ClubHangerEstimate,
  type ClubHangerDealVerdict,
} from '@/lib/aircraftEstimate'
import { estimateOwnershipCost } from '@/lib/calculators'
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

const DAY_MS = 86_400_000

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
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await getAircraftForSaleById(id)
  if (!p) notFound()

  const label = aircraftLabel(p)
  const source = sourceLabel(p.source)
  const isExternal = p.source !== 'user'
  const family = resolveMakeModelFamily(p.make, p.model)
  const grade = gradeFromScore(p.quality_score)
  const gm = gradeMeta(grade)
  const drop = priceDrop(p)
  const fresh = p.first_seen_at != null && Date.now() - new Date(p.first_seen_at).getTime() < 7 * DAY_MS
  const listed = listedAgo(p.first_seen_at)

  // Rough cost-to-own estimate (only meaningful when we have a real asking price).
  const ownership = p.asking_price ? estimateOwnershipCost(p.asking_price) : null

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

  // Spec rows — only the fields we actually have; missing ones are omitted so the
  // grid never shows a "null"/empty row.
  const specs: { icon: ReactNode; label: string; value: string }[] = []
  if (p.year) specs.push({ icon: <Calendar className="h-4 w-4 text-slate-400" />, label: 'Year', value: String(p.year) })
  if (p.ttaf != null) specs.push({ icon: <Gauge className="h-4 w-4 text-slate-400" />, label: 'Total time (TTAF)', value: `${p.ttaf.toLocaleString()} hrs` })
  if (p.smoh != null) specs.push({ icon: <Wrench className="h-4 w-4 text-slate-400" />, label: 'Engine time (SMOH)', value: `${p.smoh.toLocaleString()} hrs` })
  if (p.engine_type) specs.push({ icon: <Cpu className="h-4 w-4 text-slate-400" />, label: 'Engine', value: p.engine_type })
  if (p.avionics && p.avionics.length > 0) specs.push({ icon: <Radio className="h-4 w-4 text-slate-400" />, label: 'Avionics', value: p.avionics.join(', ') })
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
        {/* Save / share */}
        <div className="mb-6 flex items-center justify-end gap-2">
          <ShareListingButton url={detailUrl} />
          <SaveListingButton listingId={p.id} listingType="aircraft" initialSaved={false} variant="full" />
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

            {/* Estimated cost to own — transparent rule-of-thumb estimate. */}
            {ownership && (
              <div className="ch-panel p-6">
                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  <Wallet className="h-4 w-4" /> Estimated cost to own
                </h2>
                <p className="mb-4 text-xs text-slate-400">
                  A rough rule-of-thumb estimate for owning this aircraft outright — your actual costs
                  will vary with insurance, location, and how much you fly.
                </p>
                <dl className="space-y-2 text-sm">
                  <EstRow label={`Insurance (≈1% of hull value)`} value={`${money(ownership.insuranceAnnual)}/yr`} />
                  <EstRow label="Hangar / tie-down (typical)" value={`${money(ownership.hangarAnnual)}/yr`} />
                  <EstRow label="Annual inspection (typical)" value={`${money(ownership.annualInspection)}/yr`} />
                  <EstRow
                    label={`Operating @ ${ownership.hoursPerYear} hrs/yr (fuel + reserves, ~${money(
                      ownership.operatingPerHour
                    )}/hr)`}
                    value={`${money(ownership.operatingAnnual)}/yr`}
                  />
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-700">Estimated total</span>
                  <span className="text-right">
                    <span className="block text-2xl font-extrabold text-slate-900">
                      {money(ownership.totalMonthly)}/mo
                    </span>
                    <span className="text-xs text-slate-400">≈ {money(ownership.totalAnnual)}/yr</span>
                  </span>
                </div>
                <Link
                  href="/tools/cost-calculator"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Run your own numbers in the cost calculator <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
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

            {/* Source CTA — keeps the outbound path the cards used to provide. */}
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
        Based on the median asking price ({formatPrice(estimate.median)}) of {estimate.compCount}{' '}
        other {familyLabel} listing{estimate.compCount === 1 ? '' : 's'} for sale now.
      </p>
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
