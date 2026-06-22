import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Plane, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import ActiveFilterChips from '@/components/ActiveFilterChips'
import AircraftChipBar from '@/components/AircraftChipBar'
import AircraftSaleFilters from '@/components/AircraftSaleFilters'
import AircraftSaleList from '@/components/AircraftSaleList'
import AlertSignup from '@/components/AlertSignup'
import Breadcrumbs from '@/components/Breadcrumbs'
import ForSaleGuideLinks from '@/components/ForSaleGuideLinks'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'
import SaveSearchButton from '@/components/SaveSearchButton'
import { getAircraftFacets } from '@/lib/aircraft-facets'
import { describeAircraftFilters, STATE_CODES, STATE_NAMES, stateSlug, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo'
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

  return (
    <CompareProvider>
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
        </div>

        {/* Action bar — filter button visible only on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <MobileFiltersDrawer initialValues={params} activeCount={activeFilterCount} variant="sale" facets={facets} />
          </div>
          <Suspense>
            <SaveSearchButton basePath="/aircraft" />
          </Suspense>
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
            <AircraftSaleFilters initialValues={params} facets={facets} />
          </div>
        </aside>

        {/* Listings */}
        <div className="flex-1">
          {/* Active-filter chips — removable, one per active filter. */}
          <ActiveFilterChips params={params} />
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

          {/* Buying a plane? — related-guides cross-link block (internal linking
              toward the buyer-guide cluster). Additive; no new page. */}
          <ForSaleGuideLinks className="mt-4" />
        </div>
      </div>
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
