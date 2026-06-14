import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership, PartnershipSeeker } from '@/lib/types'
import { getMatchesForPartnership, getMatchesForSeeker } from '@/lib/matching-server'
import SeekerCard from './SeekerCard'
import PartnershipCard from './PartnershipCard'
import MatchScore from './MatchScore'

const MAX_INLINE = 5

async function currentUserId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url === 'https://placeholder.supabase.co') return null
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Owner-only section on a partnership detail page: pilots who match this listing.
 * Renders nothing unless the viewer is the listing's poster.
 */
export async function OwnerSeekerMatches({ partnership }: { partnership: Partnership }) {
  const uid = await currentUserId()
  if (!uid || uid !== partnership.poster_id) return null

  const results = (await getMatchesForPartnership(partnership)).slice(0, MAX_INLINE)

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          <Sparkles className="h-4 w-4" />
          {results.length > 0 ? `${results.length} pilot${results.length === 1 ? '' : 's'} match this listing` : 'Pilot matches'}
        </h2>
        <Link href="/matches" className="text-xs font-medium text-emerald-700 hover:underline">
          View all matches
        </Link>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-emerald-700/80">
          No qualifying pilots yet — as seekers post profiles near {partnership.home_airport}, the best fits show up here.
        </p>
      ) : (
        <div className="space-y-4">
          {results.map(({ seeker, match }) => (
            <div key={seeker.id}>
              <div className="mb-1.5">
                <MatchScore score={match.score} reasons={match.reasons} />
              </div>
              <SeekerCard seeker={seeker} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Owner-only section on a seeker detail page: partnerships that match this profile.
 * Renders nothing unless the viewer is the profile's poster.
 */
export async function SeekerPartnershipMatches({ seeker }: { seeker: PartnershipSeeker }) {
  const uid = await currentUserId()
  if (!uid || uid !== seeker.poster_id) return null

  const results = (await getMatchesForSeeker(seeker)).slice(0, MAX_INLINE)

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-700">
          <Sparkles className="h-4 w-4" />
          {results.length > 0 ? `${results.length} partnership${results.length === 1 ? '' : 's'} match you` : 'Partnership matches'}
        </h2>
        <Link href="/matches" className="text-xs font-medium text-sky-700 hover:underline">
          View all matches
        </Link>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-sky-700/80">
          No qualifying partnerships right now — try widening your travel radius or budget on your profile.
        </p>
      ) : (
        <div className="space-y-4">
          {results.map(({ partnership, match }) => (
            <div key={partnership.id}>
              <div className="mb-1.5">
                <MatchScore score={match.score} reasons={match.reasons} />
              </div>
              <PartnershipCard p={partnership} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
