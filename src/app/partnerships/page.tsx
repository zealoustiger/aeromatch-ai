import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Users, SlidersHorizontal } from 'lucide-react'
import PartnershipFilters from '@/components/PartnershipFilters'
import PartnershipList from '@/components/PartnershipList'
import SaveSearchButton from '@/components/SaveSearchButton'
import MobileFiltersDrawer from '@/components/MobileFiltersDrawer'

import PartnershipTabs from '@/components/PartnershipTabs'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aircraft Partnerships & Co-Ownership Near You',
  description:
    'Search aircraft partnerships by home airport, state, make, and budget. Transparent buy-in, monthly, and hourly costs on every co-ownership listing.',
}

type SearchParams = Record<string, string | undefined>

export default async function PartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const activeFilterCount = Object.values(params).filter(Boolean).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users className="h-6 w-6 text-emerald-500" />
            Aircraft Partnerships
          </h1>
          <p className="mt-1 text-slate-500">
            Find co-ownership opportunities near your home airport.
          </p>
        </div>

        {/* Action bar — filter button visible only on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <MobileFiltersDrawer initialValues={params} activeCount={activeFilterCount} />
          </div>
          <Suspense>
            <SaveSearchButton />
          </Suspense>
          <Link
            href="/partnerships/new"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 sm:px-4"
          >
            <span className="sm:hidden">+ Post</span>
            <span className="hidden sm:inline">+ Post a Partnership</span>
          </Link>
        </div>
      </div>

      <PartnershipTabs active="available" />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar — desktop only */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filter Results
            </div>
            <PartnershipFilters initialValues={params} />
          </div>
        </aside>

        {/* Listings */}
        <div className="flex-1">
          <Suspense fallback={<PartnershipListSkeleton />}>
            <PartnershipList filters={params} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function PartnershipListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
