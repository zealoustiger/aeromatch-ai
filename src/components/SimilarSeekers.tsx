import { Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PartnershipSeeker } from '@/lib/types'
import { MOCK_SEEKERS } from '@/lib/mockData'
import SeekerRailCard from './SeekerRailCard'
import RailScroller from './RailScroller'

const MAX = 12

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

/** Rank candidates: same preferred make first, then same state, then same
 *  home airport, then recency. Mirrors `SimilarListings.tsx`'s `rank()`. */
function rank(current: PartnershipSeeker, candidates: PartnershipSeeker[]): PartnershipSeeker[] {
  const currentMakes = (current.preferred_makes ?? []).map((m) => m.toLowerCase())
  const sameMake = (s: PartnershipSeeker) =>
    currentMakes.length > 0 && (s.preferred_makes ?? []).some((m) => currentMakes.includes(m.toLowerCase()))
  const sameState = (s: PartnershipSeeker) => !!current.state && s.state === current.state
  const sameAirport = (s: PartnershipSeeker) => s.home_airport === current.home_airport

  return candidates
    .filter((s) => s.id !== current.id && (sameMake(s) || sameState(s) || sameAirport(s)))
    .map((s) => ({
      s,
      score: (sameMake(s) ? 3 : 0) + (sameState(s) ? 2 : 0) + (sameAirport(s) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.s.created_at < b.s.created_at ? 1 : -1))
    .slice(0, MAX)
    .map((x) => x.s)
}

/**
 * "Similar pilots also seeking" module for the seeker detail page: other active
 * seekers sharing a preferred make, home airport, or state, ranked, excluding the
 * current listing. Closes the last gap of the "similar comparables on every
 * listing" pattern already shipped on the aircraft (`SimilarAircraft`) and
 * partnership (`SimilarListings`) detail pages. Fails soft — renders nothing
 * when there are no sensible matches.
 */
export default async function SimilarSeekers({ current }: { current: PartnershipSeeker }) {
  let candidates: PartnershipSeeker[] = []

  if (!hasSupabase()) {
    candidates = MOCK_SEEKERS
  } else {
    try {
      const supabase = await createServerSupabaseClient()
      const orParts: string[] = [`home_airport.eq.${current.home_airport}`]
      if (current.state) orParts.push(`state.eq.${current.state}`)
      for (const make of current.preferred_makes ?? []) {
        orParts.push(`preferred_makes.cs.{${make}}`)
      }
      const { data } = await supabase
        .from('partnership_seekers')
        .select('*')
        .eq('status', 'active')
        .neq('id', current.id)
        .or(orParts.join(','))
        .limit(30)
      candidates = data ?? []
    } catch {
      candidates = []
    }
  }

  const similar = rank(current, candidates)
  if (similar.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Users className="h-5 w-5 text-sky-600" />
        Similar pilots also seeking
      </h2>
      <RailScroller>
        {similar.map((s) => (
          <li key={s.id} className="shrink-0 snap-start">
            <SeekerRailCard seeker={s} />
          </li>
        ))}
      </RailScroller>
    </section>
  )
}
