import Link from 'next/link'
import { ArrowRight, Plane } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PartnershipSeeker } from '@/lib/types'
import { MOCK_SEEKERS } from '@/lib/mockData'
import { getLatestPartnerships } from '@/lib/partnerships'
import SeekerCard from './SeekerCard'
import PartnershipCard from './PartnershipCard'

async function getSeekers(state?: string, make?: string): Promise<PartnershipSeeker[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    let results = MOCK_SEEKERS
    if (state) results = results.filter((s) => s.state === state)
    if (make) results = results.filter((s) => s.preferred_makes?.some((m) => m.toLowerCase().includes(make.toLowerCase())))
    return results
  }

  const supabase = await createServerSupabaseClient()
  let query = supabase.from('partnership_seekers').select('*').eq('status', 'active').order('created_at', { ascending: false })

  if (state) query = query.eq('state', state)

  const { data } = await query
  return (data as PartnershipSeeker[]) ?? []
}

export default async function SeekerList({ filters }: { filters: Record<string, string | undefined> }) {
  const seekers = await getSeekers(filters.state, filters.make)

  if (seekers.length === 0) {
    return <SeekerEmptyState filtered={Boolean(filters.state || filters.make)} />
  }

  return (
    <div className="space-y-4">
      {seekers.map((seeker) => (
        <SeekerCard key={seeker.id} seeker={seeker} />
      ))}
    </div>
  )
}

/**
 * Improved empty state for /partnerships/seeking.
 *
 * The seeker side of the marketplace is often empty (no pilots posting "seeking"
 * listings yet), which left this trafficked page a dead-end. Instead of a bare
 * "nothing here" card we (a) explain the situation, (b) invite the visitor to
 * post their own seeking listing, and (c) surface real available partnerships so
 * the page is still useful — reusing the shared partnerships query + the same
 * PartnershipCard the /partnerships page renders. Each card links to a real
 * /partnerships/[id].
 */
async function SeekerEmptyState({ filtered }: { filtered: boolean }) {
  const partnerships = await getLatestPartnerships(3)

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100">
          <Plane className="h-6 w-6 text-sky-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {filtered
            ? 'No pilots match these filters yet'
            : 'No pilots are posting seeking-listings right now'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          This is where pilots looking for a co-ownership share post what they want.
          It&apos;s quiet at the moment — be the first to get matched with aircraft owners
          near your home airport.
        </p>
        <Link
          href="/partnerships/seeking/new"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          + Post Seeking Listing
        </Link>
      </div>

      {partnerships.length > 0 && (
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                While you&apos;re here, browse {partnerships.length} available{' '}
                {partnerships.length === 1 ? 'partnership' : 'partnerships'}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Aircraft owners actively looking for co-owners right now.
              </p>
            </div>
            <Link
              href="/partnerships"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 sm:flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {partnerships.map((p) => (
              <PartnershipCard key={p.id} p={p} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/partnerships"
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600"
            >
              View all partnerships <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
