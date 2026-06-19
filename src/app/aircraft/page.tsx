import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Plane, SlidersHorizontal } from 'lucide-react'
import AircraftSaleFilters from '@/components/AircraftSaleFilters'
import AircraftSaleList from '@/components/AircraftSaleList'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'
import SaveSearchButton from '@/components/SaveSearchButton'
import { getAircraftFacets } from '@/lib/aircraft-facets'

export const metadata: Metadata = {
  title: 'Aircraft for Sale — Search GA Listings From Across the Web',
  description:
    'Search general aviation aircraft for sale aggregated from Barnstormers and more. Filter by make, year, price, and location — every listing links back to the source.',
  alternates: { canonical: '/aircraft' },
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Plane className="h-6 w-6 text-sky-500" />
            Planes for Sale
          </h1>
          <p className="mt-1 text-slate-500">
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

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar — desktop only */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filter Results
            </div>
            <AircraftSaleFilters initialValues={params} facets={facets} />
          </div>
        </aside>

        {/* Listings */}
        <div className="flex-1">
          <Suspense key={JSON.stringify(params)} fallback={<AircraftListSkeleton />}>
            <AircraftSaleList filters={params} />
          </Suspense>

          {/* Aggregation disclosure */}
          <p className="mt-6 text-xs text-slate-400">
            Listings are aggregated from third-party sites and link back to the original source.
            ClubHanger is not the seller. Listing data may be out of date — confirm details on the
            source listing.
          </p>
        </div>
      </div>
    </div>
  )
}

function AircraftListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
