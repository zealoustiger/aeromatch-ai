import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, Search, Plane, ArrowRight } from 'lucide-react'
import PartnershipCard from '@/components/PartnershipCard'
import SeekerCard from '@/components/SeekerCard'
import MatchScore from '@/components/MatchScore'
import {
  getCurrentUserListings,
  getMatchesForSeeker,
  getMatchesForPartnership,
} from '@/lib/matching-server'

export const metadata: Metadata = {
  title: 'Your Matches',
  description: 'Aircraft partnerships and pilots matched to your ClubHanger listings by compatibility.',
  robots: { index: false, follow: false },
}

const MAX_PER_LISTING = 12

export default async function MatchesPage() {
  const { userId, seekers, partnerships } = await getCurrentUserListings()
  if (!userId) redirect('/auth?next=/matches')

  const [seekerMatches, partnershipMatches] = await Promise.all([
    Promise.all(
      seekers.map(async (seeker) => ({
        seeker,
        results: (await getMatchesForSeeker(seeker)).slice(0, MAX_PER_LISTING),
      }))
    ),
    Promise.all(
      partnerships.map(async (partnership) => ({
        partnership,
        results: (await getMatchesForPartnership(partnership)).slice(0, MAX_PER_LISTING),
      }))
    ),
  ])

  const hasAnyListing = seekers.length > 0 || partnerships.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          Your Matches
        </h1>
        <p className="mt-1 text-slate-500">
          Compatibility-ranked from the structured data in your listings — geography, budget, ratings, and mission fit.
        </p>
      </div>

      {!hasAnyListing && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">You don&apos;t have any active listings yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Post a seeker profile to get matched with partnerships, or post a partnership to find qualified pilots.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/partnerships/seeking/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Search className="h-4 w-4" /> Post a seeker profile
            </Link>
            <Link
              href="/partnerships/new"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Plane className="h-4 w-4" /> Post a partnership
            </Link>
          </div>
        </div>
      )}

      {/* Seeker → partnerships */}
      {seekerMatches.map(({ seeker, results }) => (
        <section key={seeker.id} className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {results.length > 0 ? `${results.length} ` : ''}partnership{results.length === 1 ? '' : 's'} match{' '}
              <Link href={`/partnerships/seeking/${seeker.id}`} className="text-sky-700 hover:underline">
                {seeker.title}
              </Link>
            </h2>
          </div>

          {results.length === 0 ? (
            <EmptyMatches
              text="No qualifying partnerships right now."
              hint="We'll keep ranking new listings against your profile — check back or widen your travel radius."
            />
          ) : (
            <div className="space-y-4">
              {results.map(({ partnership, match }) => (
                <div key={partnership.id}>
                  <div className="mb-1.5">
                    <MatchScore score={match.score} reasons={match.reasons} />
                  </div>
                  <PartnershipCard p={partnership} />
                  {match.reasons.length > 0 && <ReasonRow reasons={match.reasons} />}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Owner → seekers */}
      {partnershipMatches.map(({ partnership, results }) => (
        <section key={partnership.id} className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {results.length} pilot{results.length === 1 ? '' : 's'} match{' '}
              <Link href={`/partnerships/${partnership.id}`} className="text-sky-700 hover:underline">
                {partnership.title}
              </Link>
            </h2>
          </div>

          {results.length === 0 ? (
            <EmptyMatches
              text="No qualifying pilots yet."
              hint="As pilots post seeker profiles near your airport, the best fits will appear here."
            />
          ) : (
            <div className="space-y-4">
              {results.map(({ seeker, match }) => (
                <div key={seeker.id}>
                  <div className="mb-1.5">
                    <MatchScore score={match.score} reasons={match.reasons} />
                  </div>
                  <SeekerCard seeker={seeker} />
                  {match.reasons.length > 0 && <ReasonRow reasons={match.reasons} />}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {hasAnyListing && (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
          <Link href="/partnerships" className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline">
            Browse all partnerships <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

function ReasonRow({ reasons }: { reasons: string[] }) {
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-1 text-xs text-slate-500">
      {reasons.slice(0, 2).map((r, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="text-emerald-500" aria-hidden="true">
            ✓
          </span>
          {r}
        </span>
      ))}
    </p>
  )
}

function EmptyMatches({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-slate-500">{text}</p>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
    </div>
  )
}
