import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Handshake, UserSearch } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { aircraftLabel } from '@/lib/utils'
import type { Partnership, PartnershipSeeker } from '@/lib/types'
import PartnershipRailCard from '@/components/PartnershipRailCard'
import SeekerRailCard from '@/components/SeekerRailCard'
import RailScroller from '@/components/RailScroller'
import {
  getMatchingSeekersForPartnership,
  getMatchingPartnershipsForSeeker,
  seekerBrowseHrefForPartnership,
  partnershipBrowseHrefForSeeker,
} from '@/lib/matchingQuery'

export const metadata: Metadata = {
  title: 'Your Matches — ClubHanger',
  description: 'Pilots and partnerships that match your listings on ClubHanger.',
  robots: { index: false, follow: false },
}

const SAMPLE_LIMIT = 6

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?next=/matches')

  // Only the signed-in owner's own active listings — matches are computed against the
  // other side of the marketplace via the shared matchingQuery helpers.
  const { data: partnershipRows } = await supabase
    .from('partnerships')
    .select('*')
    .eq('poster_id', user.id)
    .eq('status', 'active')

  const { data: seekerRows } = await supabase
    .from('partnership_seekers')
    .select('*')
    .eq('poster_id', user.id)
    .eq('status', 'active')

  const partnerships = (partnershipRows ?? []) as Partnership[]
  const seekers = (seekerRows ?? []) as PartnershipSeeker[]

  const partnershipMatches = await Promise.all(
    partnerships.map((p) => getMatchingSeekersForPartnership(p))
  )
  const seekerMatches = await Promise.all(
    seekers.map((s) => getMatchingPartnershipsForSeeker(s))
  )

  const partnershipSections = partnerships
    .map((p, i) => ({ listing: p, matches: partnershipMatches[i] }))
    .filter((section) => section.matches.length > 0)

  const seekerSections = seekers
    .map((s, i) => ({ listing: s, matches: seekerMatches[i] }))
    .filter((section) => section.matches.length > 0)

  const hasAnyMatches = partnershipSections.length > 0 || seekerSections.length > 0
  const hasAnyListings = partnerships.length > 0 || seekers.length > 0

  return (
    <div className="ch-surface min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users className="h-6 w-6 text-sky-600" />
            Your Matches
          </h1>
          <p className="mt-1 text-slate-500">
            Pilots and partnerships on ClubHanger that match what your own listings are looking for.
          </p>
        </div>

        {!hasAnyMatches && (
          <div className="ch-panel flex flex-col items-center py-14 text-center">
            <Users className="mb-4 h-10 w-10 text-slate-300" />
            <p className="mb-1 font-semibold text-slate-700">
              {hasAnyListings ? 'No matches yet' : 'No active listings yet'}
            </p>
            <p className="mb-6 max-w-sm text-sm text-slate-500">
              {hasAnyListings
                ? "We'll show real matches here as soon as a compatible partnership or seeking listing is posted."
                : 'Post a partnership or a seeking listing to start seeing real matches here.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/partnerships/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <Handshake className="h-4 w-4" /> Post a partnership
              </Link>
              <Link
                href="/partnerships/seeking/new"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <UserSearch className="h-4 w-4" /> Seeking a partnership
              </Link>
            </div>
          </div>
        )}

        {partnershipSections.map(({ listing, matches }) => (
          <section key={`p-${listing.id}`} className="mb-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Pilots seeking a match for your {aircraftLabel(listing.make, listing.model, listing.year)} partnership
              </h2>
              <Link
                href={seekerBrowseHrefForPartnership(listing)}
                className="shrink-0 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Browse all {matches.length} &rarr;
              </Link>
            </div>
            <RailScroller>
              {matches.slice(0, SAMPLE_LIMIT).map((s) => (
                <li key={s.id} className="shrink-0 snap-start">
                  <SeekerRailCard seeker={s} />
                </li>
              ))}
            </RailScroller>
          </section>
        ))}

        {seekerSections.map(({ listing, matches }) => (
          <section key={`s-${listing.id}`} className="mb-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Available partnerships matching your seeking listing
              </h2>
              <Link
                href={partnershipBrowseHrefForSeeker(listing)}
                className="shrink-0 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Browse all {matches.length} &rarr;
              </Link>
            </div>
            <RailScroller>
              {matches.slice(0, SAMPLE_LIMIT).map((p) => (
                <li key={p.id} className="shrink-0 snap-start">
                  <PartnershipRailCard p={p} />
                </li>
              ))}
            </RailScroller>
          </section>
        ))}
      </div>
    </div>
  )
}
