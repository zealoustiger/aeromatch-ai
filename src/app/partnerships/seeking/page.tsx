import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import SeekerList from '@/components/SeekerList'
import PartnershipTabs from '@/components/PartnershipTabs'

export const metadata: Metadata = {
  title: 'Pilots Seeking Aircraft Partnerships',
  description:
    'Browse pilots actively looking for aircraft co-ownership shares — with budgets, ratings, and home airports listed. Find your next partner.',
}

type SearchParams = Record<string, string | undefined>

export default async function SeekingPartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Search className="h-6 w-6 text-emerald-500" />
            Pilots Seeking Partnerships
          </h1>
          <p className="mt-1 text-slate-500">
            Qualified pilots looking for a co-ownership share near their home airport.
          </p>
        </div>
        <Link
          href="/partnerships/seeking/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          + Post Seeking Listing
        </Link>
      </div>

      <PartnershipTabs active="seeking" />

      <Suspense fallback={<SeekerListSkeleton />}>
        <SeekerList filters={params} />
      </Suspense>
    </div>
  )
}

function SeekerListSkeleton() {
  // A single lightweight row instead of three full-height card skeletons, so a
  // cold load with no results doesn't flash a heavy 3-card grid before
  // collapsing to a one-line empty state.
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
      Loading seeking listings…
    </div>
  )
}
