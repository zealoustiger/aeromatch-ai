import { Layers } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'
import { partnershipBuyInComp, partnershipDealVerdict } from '@/lib/partnershipComps'
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

  // Batch-fetch buy-in prices per unique make so we can show the year+hours-controlled
  // "Good deal"/"Priced high" Deal Check verdict on each card, mirroring
  // SimilarAircraft.tsx's clubHangerDealVerdict-only rail treatment ('fair' suppressed).
  // The `year`/`ttaf`/`smoh` columns are fetched via a SEPARATE query/try-catch from the
  // base buy-in/share columns below — they're dormant behind a pending migration (see
  // `partnership-deal-check`'s detail-page panel), so a missing-column error there falls
  // back to the plain whole-family-less "Below/Above market" pill this rail has always
  // shown, instead of taking the chip down entirely.
  const verdicts = new Map<string, 'below' | 'above'>()
  const uniqueMakes = [...new Set(similar.map((p) => p.make).filter(Boolean))] as string[]

  if (uniqueMakes.length > 0 && hasSupabase()) {
    try {
      const supabase = await createServerSupabaseClient()

      type BaseCompRow = { id: string; buy_in_price: number; total_shares: number | null }
      const baseResults = await Promise.all(
        uniqueMakes.map((make) =>
          supabase
            .from('partnerships')
            .select('id, buy_in_price, total_shares')
            .eq('status', 'active')
            .eq('make', make)
            .not('buy_in_price', 'is', null)
            .limit(200)
        )
      )
      const baseRows = new Map<string, BaseCompRow[]>()
      uniqueMakes.forEach((make, i) => {
        baseRows.set(
          make,
          (baseResults[i].data ?? []).filter(
            (r): r is BaseCompRow => r.buy_in_price != null && r.buy_in_price > 0
          )
        )
      })

      type DealCompRow = BaseCompRow & { year: number | null; ttaf: number | null; smoh: number | null }
      const dealRows = new Map<string, DealCompRow[]>()
      try {
        const dealResults = await Promise.all(
          uniqueMakes.map((make) =>
            supabase
              .from('partnerships')
              .select('id, buy_in_price, total_shares, year, ttaf, smoh')
              .eq('status', 'active')
              .eq('make', make)
              .not('buy_in_price', 'is', null)
              .limit(200)
          )
        )
        uniqueMakes.forEach((make, i) => {
          dealRows.set(
            make,
            (dealResults[i].data ?? []).filter(
              (r): r is DealCompRow => r.buy_in_price != null && r.buy_in_price > 0
            )
          )
        })
      } catch {
        // Narrowed Deal Check stays dormant until the migration is applied; base chip
        // (below) still renders.
      }

      for (const p of similar) {
        if (!p.buy_in_price || !p.make || !p.total_shares) continue

        const dRows = dealRows.get(p.make) ?? []
        const otherDealComps = dRows
          .filter((r) => r.id !== p.id)
          .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares, year: r.year, ttaf: r.ttaf, smoh: r.smoh }))
        const dealVerdict = partnershipDealVerdict(
          { buyIn: p.buy_in_price, totalShares: p.total_shares, year: p.year, ttaf: p.ttaf, smoh: p.smoh },
          otherDealComps
        )
        if (dealVerdict) {
          if (dealVerdict.verdict !== 'fair') {
            verdicts.set(p.id, dealVerdict.verdict === 'good' ? 'below' : 'above')
          }
          continue
        }

        const bRows = baseRows.get(p.make) ?? []
        const otherComps = bRows
          .filter((r) => r.id !== p.id)
          .map((r) => ({ buyIn: r.buy_in_price, totalShares: r.total_shares }))
        const comp = partnershipBuyInComp(p.buy_in_price, p.total_shares, otherComps)
        if (comp && comp.kind !== 'near') {
          verdicts.set(p.id, comp.kind)
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
