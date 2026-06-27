import { Layers } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { partnershipBuyInComp } from '@/lib/partnershipComps'
import PartnershipRailCard from './PartnershipRailCard'
import RailScroller from './RailScroller'

const MAX = 12

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
 *
 * Presentation: a horizontal snap-carousel (hidden scrollbar + scroll-snap +
 * desktop chevrons) of compact `PartnershipRailCard`s, shared with the homepage
 * curated rails and the aircraft "Similar" rail via `RailScroller` — the
 * partnership twin of the "more like this" Option-B rail.
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

  // Batch-fetch buy-in prices per unique make so we can show honest "Below market"
  // / "Above market" chips on each card. One DB query per unique make (typically 1-2
  // for a same-make similar set). Fails soft — verdicts stay empty on any error.
  const verdicts = new Map<string, 'below' | 'above'>()
  const uniqueMakes = [...new Set(similar.map((p) => p.make).filter(Boolean))] as string[]

  if (uniqueMakes.length > 0 && hasSupabase()) {
    try {
      const supabase = await createServerSupabaseClient()
      // Fetch all active buy-in prices for each unique make in parallel.
      const priceResults = await Promise.all(
        uniqueMakes.map((make) =>
          supabase
            .from('partnerships')
            .select('id, buy_in_price')
            .eq('status', 'active')
            .eq('make', make)
            .not('buy_in_price', 'is', null)
            .limit(200)
        )
      )

      // Build make → [{id, buy_in_price}] map.
      const makeRows = new Map<string, { id: string; buy_in_price: number }[]>()
      uniqueMakes.forEach((make, i) => {
        const rows = (priceResults[i].data ?? [])
          .filter((r): r is { id: string; buy_in_price: number } => r.buy_in_price != null && r.buy_in_price > 0)
        makeRows.set(make, rows)
      })

      // Compute verdict for each similar listing with a buy-in price.
      for (const p of similar) {
        if (!p.buy_in_price || !p.make) continue
        const rows = makeRows.get(p.make) ?? []
        // Exclude this listing's own price from the comp set (honesty: don't
        // compare a listing to itself). Use the fetched IDs for exact exclusion.
        const otherBuyIns = rows.filter((r) => r.id !== p.id).map((r) => r.buy_in_price)
        const result = partnershipBuyInComp(p.buy_in_price, otherBuyIns)
        if (result && result.kind !== 'near') {
          verdicts.set(p.id, result.kind)
        }
      }
    } catch {
      // Verdicts stay empty — cards render without chips.
    }
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Layers className="h-5 w-5 text-sky-600" />
        Similar partnerships
      </h2>
      <RailScroller>
        {similar.map((p) => (
          <li key={p.id} className="shrink-0 snap-start">
            <PartnershipRailCard p={p} compVerdict={verdicts.get(p.id)} />
          </li>
        ))}
      </RailScroller>
    </section>
  )
}
