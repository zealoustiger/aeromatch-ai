import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Plane, SlidersHorizontal, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import ActiveFilterChips from '@/components/ActiveFilterChips'
import AircraftChipBar from '@/components/AircraftChipBar'
import AircraftSaleFilters from '@/components/AircraftSaleFilters'
import AircraftSaleList, { fetchAircraftPage } from '@/components/AircraftSaleList'
import { countActivePartnerships, getPartnershipListings } from '@/lib/partnershipsQuery'
import AlertSignup from '@/components/AlertSignup'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import MarketplaceCrossSell from '@/components/MarketplaceCrossSell'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'
import ModelFaq from '@/components/ModelFaq'
import SaveSearchButton from '@/components/SaveSearchButton'
import { getAircraftFacets } from '@/lib/aircraft-facets'
import { describeAircraftFilters, STATE_CODES, STATE_NAMES, stateSlug, SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo'
import { buildAircraftItemListJsonLd, buildAircraftAggregateOfferJsonLd, buildFaqPageJsonLd } from '@/lib/aircraftJsonLd'
import { MISSIONS } from '@/lib/missions'
import { COMPARISONS, comparisonLabel } from '@/lib/aircraftComparisons'
import { CompareProvider } from '@/components/CompareProvider'
import CompareTray from '@/components/CompareTray'

const aircraftTitle = 'Aircraft for Sale — Search GA Listings From Across the Web'
const aircraftDescription =
  'Search general aviation aircraft for sale aggregated from Barnstormers and more. Filter by make, year, price, and location — every listing links back to the source.'

export const metadata: Metadata = {
  title: aircraftTitle,
  description: aircraftDescription,
  alternates: { canonical: '/aircraft' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: '/aircraft',
    title: aircraftTitle,
    description: aircraftDescription,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: aircraftTitle,
    description: aircraftDescription,
    images: [DEFAULT_OG_IMAGE],
  },
}

// Unique, evergreen editorial prose for the for-sale hub (content depth for the
// INDEXING stage — priority seed page #2). No live counts / fabricated stats, so
// it stays accurate over time. Distinct in angle from the PARTNERSHIPS_OVERVIEW.
const AIRCRAFT_OVERVIEW: string[] = [
  'ClubHanger aggregates general-aviation aircraft for sale from across the web — sources like Barnstormers and other classifieds — into one searchable place. Every listing links back to its original source, where you complete the purchase: ClubHanger is a search tool, not the seller or a broker, and we never take a commission on a sale.',
  'Use the filters to narrow the market the way buyers actually shop — by make and model, asking price, year, total time on the airframe, and location. The chip bar at the top sets the same filters in one tap, and you can save a search to get an email when new matching aircraft are listed. Listing data comes from third parties and can go stale, so always confirm the details on the source listing before you act.',
  'Buying a used aircraft is a bigger commitment than the sticker price: budget for a pre-buy inspection, review the logbooks and damage history, and weigh ongoing costs like the annual, insurance, and hangar or tie-down. If owning a whole aircraft is more than you need, a co-ownership partnership splits those costs across several pilots — browse open shares under Partnerships.',
]

// Curated, evergreen FAQ for the for-sale hub — genuine questions a buyer searches.
// Rendered as a visible accordion AND emitted as FAQPage JSON-LD, so the visible
// text must match the structured data 1:1 (ModelFaq + buildFaqPageJsonLd share this
// array). No fabricated stats / live counts → never goes stale.
const AIRCRAFT_FAQS: { q: string; a: string }[] = [
  {
    q: 'Where do these aircraft for sale come from?',
    a: 'They are aggregated from third-party aircraft classifieds across the web, such as Barnstormers. ClubHanger collects them into one searchable place and links each listing back to its original source, where the sale actually happens. ClubHanger is not the seller and does not take a commission.',
  },
  {
    q: 'How do I search for a specific aircraft?',
    a: 'Use the filters to narrow by make and model, asking price, year, total time on the airframe, and location. The quick-filter chip bar at the top of the page sets the same filters in one tap, and you can sort by newest, price, or recent price drops.',
  },
  {
    q: 'How much does it cost to buy a used general aviation aircraft?',
    a: 'It varies widely by type, age, hours, and avionics — a basic two-seat trainer and a glass-panel cross-country single sit at very different price points. Each listing shows the seller’s asking price, and many also show how that price compares to other similar aircraft on the marketplace so you can judge whether it is priced below, around, or above the market.',
  },
  {
    q: 'What should I check before buying a used aircraft?',
    a: 'Review the airframe and engine logbooks, the time since the last engine overhaul, any damage history, and when the last annual inspection was completed. Most buyers also commission an independent pre-buy inspection before closing. Always confirm the details on the source listing, since aggregated data can be out of date.',
  },
  {
    q: 'Can I buy a share of an aircraft instead of the whole thing?',
    a: 'Yes. If owning an entire aircraft is more than you need, a co-ownership partnership lets several pilots split the purchase and the ongoing costs. Browse open partnership shares under Partnerships, or use the cost calculator to compare full ownership against a share.',
  },
]

type SearchParams = Record<string, string | undefined>

export default async function AircraftPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeFilterCount = Object.values(params).filter(Boolean).length
  const facets = await getAircraftFacets()

  // Filter-aware email-alert context + reproducible source path. The route-based
  // for-sale pages carry their scope in the URL path; `/aircraft` carries it in
  // the query string, so we preserve the active query on the source path and
  // describe the filters in the alert context (e.g. "Cessna 172 in California").
  const alertContext = describeAircraftFilters(params)
  const alertQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][]
  ).toString()
  const alertSourcePath = alertQuery ? `/aircraft?${alertQuery}` : '/aircraft'

  // ItemList JSON-LD for the listings the visitor actually sees — fetched with the
  // SAME filters AircraftSaleList renders below, so the structured data matches the
  // visible cards 1:1 (mirrors the make/model/state sub-family pages, which already
  // emit ItemList; this closes the gap on the /aircraft hub, priority seed page #2).
  // The helper returns null (renders nothing) when no priced/valid rows qualify.
  const { listings: itemListListings } = await fetchAircraftPage(params)
  const itemListJsonLd = buildAircraftItemListJsonLd(itemListListings, {
    name: aircraftTitle,
    url: `${SITE_URL}/aircraft`,
  })
  // Page-level price-range AggregateOffer from the SAME listings (real asking_price
  // only; null when <2 priced). Brings the /aircraft hub (priority seed page #2) to
  // structured-data parity with the make / make+model / state sub-family pages, which
  // already emit this — price-range rich-result eligibility for the INDEXING stage.
  const aggregateOfferJsonLd = buildAircraftAggregateOfferJsonLd(itemListListings, {
    name: aircraftTitle,
    url: `${SITE_URL}/aircraft`,
  })
  // FAQPage JSON-LD — questions/answers match the visible ModelFaq accordion 1:1.
  const faqJsonLd = buildFaqPageJsonLd(AIRCRAFT_FAQS, {
    url: `${SITE_URL}/aircraft`,
  })

  return (
    <CompareProvider>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {aggregateOfferJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateOfferJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
    {/* Warm cream marketplace surface (Etsy×Airbnb design tokens — slice 1).
        Full-bleed cream behind the reference surface, reversible + scoped here. */}
    <div className="ch-surface min-h-screen">
    {/* Extra bottom padding so the fixed compare tray never overlaps content. */}
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Aircraft for Sale' },
        ]}
      />

      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
            <Plane className="h-7 w-7 text-sky-500" />
            Planes for Sale
          </h1>
          <p className="mt-1 text-slate-600">
            Aircraft for sale aggregated from across the web — search them all in one place.
          </p>
          <Link
            href="/aircraft/deals"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <TrendingDown className="h-4 w-4" />
            See aircraft priced below market
          </Link>
        </div>

        {/* Action bar — filter button visible only on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <MobileFiltersDrawer initialValues={params} activeCount={activeFilterCount} variant="sale" facets={facets} />
          </div>
          <Suspense>
            <SaveSearchButton basePath="/aircraft" />
          </Suspense>
          <Link
            href="/aircraft/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <Plane className="h-4 w-4" />
            Sell your aircraft
          </Link>
        </div>
      </div>

      {/* Airbnb-style quick-filter chip bar (Etsy×Airbnb refresh — slice 3).
          Horizontally-scrolling chips that set existing filter URL params
          (make / price band / mission). Reuses the slice-1 .ch-* tokens. */}
      <AircraftChipBar facets={facets} />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar — desktop only */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <div className="ch-panel sticky top-24 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filter Results
            </div>
            <AircraftSaleFilters initialValues={params} facets={facets} saveSearchBasePath="/aircraft" />
          </div>
        </aside>

        {/* Listings — min-w-0 lets the column shrink to fit so inner
            overflow-x-auto rails (cross-sell samples) scroll instead of
            widening the page at desktop. */}
        <div className="min-w-0 flex-1">
          {/* Active-filter chips — removable, one per active filter. */}
          <ActiveFilterChips params={params} facets={facets} />
          <Suspense key={JSON.stringify(params)} fallback={<AircraftListSkeleton />}>
            <AircraftSaleList filters={params} />
          </Suspense>

          {/* Aggregation disclosure */}
          <p className="mt-6 text-xs text-slate-400">
            Listings are aggregated from third-party sites and link back to the original source.
            ClubHanger is not the seller. Listing data may be out of date — confirm details on the
            source listing.
          </p>

          {/* Email-alerts capture — inline, no account required. Filter-aware:
              the context describes the active search so the alert is useful. */}
          <AlertSignup context={alertContext} sourcePath={alertSourcePath} />

          {/* Browse by state — crawlable internal links to the per-state for-sale pages */}
          <div className="ch-panel mt-10 p-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Aircraft for sale by state</h2>
              <Link
                href="/aircraft/browse"
                className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
              >
                Browse all makes, models &amp; states →
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {STATE_CODES.map((c) => (
                <Link
                  key={c}
                  href={`/aircraft/for-sale/${stateSlug(STATE_NAMES[c])}`}
                  className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                >
                  {STATE_NAMES[c]}
                </Link>
              ))}
            </div>
          </div>

          {/* Browse by mission — crawlable internal links to the curated mission
              landing pages (glass cockpit / IFR / tailwheel / low-time). Reaches
              the new family from the priority seed page #2. */}
          <div className="ch-panel mt-4 p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Browse aircraft by mission</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {MISSIONS.map((m) => (
                <Link
                  key={m.slug}
                  href={`/aircraft/mission/${m.slug}`}
                  className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                >
                  {m.h1}
                </Link>
              ))}
            </div>
          </div>

          {/* Compare aircraft head-to-head — crawlable internal links to the curated
              comparison pages ("{model} vs {model}"). Reaches that family from the
              priority seed page #2 (previously linked only from individual model hubs),
              spreading crawl equity from a high-authority page. Labels via the shared
              comparisonLabel helper; any pair that fails to resolve is skipped. */}
          <div className="ch-panel mt-4 p-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Compare aircraft head-to-head</h2>
              <Link
                href="/aircraft/compare"
                className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
              >
                View all comparisons →
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {COMPARISONS.map((c) => {
                const label = comparisonLabel(c)
                if (!label) return null
                return (
                  <Link
                    key={c.slug}
                    href={`/aircraft/compare/${c.slug}`}
                    className="text-sm text-slate-500 hover:text-sky-600 hover:underline"
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Cross-sell to the other marketplace type (co-ownership partnerships).
              Make-aware: carries the active make filter through. */}
          <MarketplaceCrossSell
            from="aircraft"
            make={params.make}
            count={await countActivePartnerships(params.make)}
            samples={(await getPartnershipListings({ make: params.make })).listings}
            className="mt-10"
          />

          {/* Buying a plane? — related-guides cross-link block (internal linking
              toward the buyer-guide cluster). Additive; no new page. */}
          <ForSaleGuideLinks className="mt-4" />
        </div>
      </div>

      {/* About — unique, evergreen editorial prose (content depth for the INDEXING
          stage, priority seed page #2). Below the listings so the page leads with
          filters + results. Mirrors the /partnerships hub. */}
      <section className="mt-12 ch-panel p-5 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          About buying aircraft on ClubHanger
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {AIRCRAFT_OVERVIEW.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {/* Evergreen FAQ — visible accordion + matching FAQPage JSON-LD above. */}
      <ModelFaq label="Buying an aircraft" faqs={AIRCRAFT_FAQS} className="mt-8" />
    </div>
    </div>
    <CompareTray />
    </CompareProvider>
  )
}

function AircraftListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
