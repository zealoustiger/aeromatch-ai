import { Suspense } from 'react'
import { Users, SlidersHorizontal } from 'lucide-react'
import PartnershipFilters from '@/components/PartnershipFilters'
import PartnershipList from '@/components/PartnershipList'
import Link from 'next/link'

type SearchParams = Record<string, string | undefined>

export default async function PartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users className="h-6 w-6 text-emerald-500" />
            Aircraft Partnerships
          </h1>
          <p className="mt-1 text-slate-500">
            Find co-ownership opportunities near your home airport.
          </p>
        </div>
        <Link
          href="/partnerships/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          + Post a Partnership
        </Link>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
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
