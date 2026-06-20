import { Layers } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import PartnershipCard from './PartnershipCard'

const MAX = 3

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

/** Rank candidates: same make first, then same state, then most recent. */
function rank(current: Partnership, candidates: Partnership[]): Partnership[] {
  const sameMake = (p: Partnership) => p.make?.toLowerCase() === current.make?.toLowerCase()
  const sameState = (p: Partnership) => !!current.state && p.state === current.state
  return candidates
    .filter((p) => p.id !== current.id && (sameMake(p) || sameState(p) || p.home_airport === current.home_airport))
    .map((p) => ({
      p,
      score: (sameMake(p) ? 3 : 0) + (sameState(p) ? 2 : 0) + (p.home_airport === current.home_airport ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.p.created_at < b.p.created_at ? 1 : -1))
    .slice(0, MAX)
    .map((x) => x.p)
}

/**
 * "Similar listings" module for partnership detail pages: same make or same
 * home-airport region, ranked, excluding the current listing. Fails soft (renders
 * nothing) when there are no sensible matches.
 */
export default async function SimilarListings({ current }: { current: Partnership }) {
  let candidates: Partnership[] = []

  if (!hasSupabase()) {
    candidates = MOCK_PARTNERSHIPS
  } else {
    try {
      const supabase = await createServerSupabaseClient()
      const orParts = [`make.eq.${current.make}`]
      if (current.state) orParts.push(`state.eq.${current.state}`)
      orParts.push(`home_airport.eq.${current.home_airport}`)
      const { data } = await supabase
        .from('partnerships')
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
        <Layers className="h-5 w-5 text-sky-600" />
        Similar partnerships
      </h2>
      <div className="space-y-4">
        {similar.map((p) => (
          <PartnershipCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  )
}
