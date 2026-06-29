import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Partnership } from '@/lib/types'
import { getPartnershipListings, type PartnershipFilters } from '@/lib/partnershipsQuery'
import { partnershipBuyInComp } from '@/lib/partnershipComps'
import PartnershipCard from './PartnershipCard'

/**
 * Partnership list surface. The fetch + trust-sort now live in the shared
 * `getPartnershipListings` helper (so the state/make pages can build ItemList
 * JSON-LD from the exact same result set this renders — no cloaking). This
 * component additionally hydrates the signed-in viewer's saved listings so cards
 * render filled hearts; that read is UI-only and stays here.
 */
export default async function PartnershipList({ filters }: { filters: PartnershipFilters }) {
  const { listings, airportList, error } = await getPartnershipListings(filters)

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-600">
        Failed to load listings. Please try again.
      </div>
    )
  }

  let savedIds = new Set<string>()
  const verdicts = new Map<string, { kind: 'below' | 'above'; pct: number; median: number; count: number }>()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (hasSupabase && listings.length > 0) {
    const supabase = await createServerSupabaseClient()

    // Saved-listings hydration (fills hearts on cards).
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: saved } = await supabase
          .from('saved_listings')
          .select('listing_id')
          .eq('user_id', user.id)
          .eq('listing_type', 'partnership')
          .in('listing_id', listings.map((l) => l.id))
        savedIds = new Set((saved ?? []).map((s) => s.listing_id as string))
      }
    } catch {
      // Non-fatal: just render without filled hearts.
    }

    // Comp verdict chips: batch-fetch buy-in prices per unique make so we can show
    // "Below market" / "Above market" on cards that are clearly priced off median.
    // One DB query per unique make (typically 1-4). Fails soft — no chips on error.
    try {
      const uniqueMakes = [
        ...new Set(listings.filter((l) => l.buy_in_price && l.make).map((l) => l.make as string)),
      ]
      if (uniqueMakes.length > 0) {
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
        const makeRows = new Map<string, { id: string; buy_in_price: number }[]>()
        uniqueMakes.forEach((make, i) => {
          makeRows.set(
            make,
            (priceResults[i].data ?? []).filter(
              (r): r is { id: string; buy_in_price: number } => r.buy_in_price != null && r.buy_in_price > 0
            )
          )
        })
        for (const p of listings) {
          if (!p.buy_in_price || !p.make) continue
          const rows = makeRows.get(p.make) ?? []
          const otherBuyIns = rows.filter((r) => r.id !== p.id).map((r) => r.buy_in_price)
          const result = partnershipBuyInComp(p.buy_in_price, otherBuyIns)
          if (result && result.kind !== 'near') {
            verdicts.set(p.id, { kind: result.kind, pct: result.pct, median: result.median, count: result.count })
          }
        }
      }
    } catch {
      // Non-fatal: cards render without comp chips.
    }
  }

  return renderList(listings, filters, airportList, savedIds, verdicts)
}

function renderList(listings: Partnership[], filters: PartnershipFilters, airportList: string[], savedIds: Set<string> = new Set(), verdicts: Map<string, { kind: 'below' | 'above'; pct: number; median: number; count: number }> = new Map()) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No partnerships found yet.</p>
        <p className="mt-1 text-sm text-slate-400">Be the first — post a listing and get discovered.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        {listings.length} {listings.length === 1 ? 'partnership' : 'partnerships'} found
        {filters.airport && filters.radius ? (
          <span className="ml-1">
            within <strong>{filters.radius} miles</strong> of{' '}
            <strong>{filters.airport.toUpperCase()}</strong>
            {airportList.length > 1 && (
              <span className="text-slate-400"> ({airportList.length} airports)</span>
            )}
          </span>
        ) : airportList.length > 0 ? (
          <span className="ml-1">near <strong>{airportList.join(', ')}</strong></span>
        ) : null}
      </p>
      <div className="space-y-4">
        {listings.map((p) => (
          <PartnershipCard key={p.id} p={p} saved={savedIds.has(p.id)} compVerdict={verdicts.get(p.id)} />
        ))}
      </div>
    </div>
  )
}
