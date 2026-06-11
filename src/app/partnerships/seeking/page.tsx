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
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}
