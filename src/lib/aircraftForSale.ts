import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AircraftForSale } from '@/lib/types'

/**
 * Single for-sale aircraft fetch by id. Mirrors `getPartnershipById` in
 * `src/lib/partnerships.ts` so the `/compare` view reuses one fetch path per
 * marketplace. Returns null for a missing/invalid id (the `/compare` page drops
 * those and handles the "fewer than asked for" case). No mock fallback: the
 * for-sale marketplace has no mock data, so without Supabase it returns null.
 */
export async function getAircraftForSaleById(id: string): Promise<AircraftForSale | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) return null

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('aircraft_for_sale')
      .select('*')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

// Buyer-surface price floor for indexability: the verified sub-$50k for-sale rows
// are parts/projects ("M20C COWLING", "O-235 MAGS", rivet-gun kits), not flyable
// aircraft, and no-price rows are unsuitable as standalone detail pages. Gating the
// sitemap to priced real aircraft keeps Google's crawl budget on genuine listings
// (GOAL.md: no thin/junk/doorway pages).
const SITEMAP_PRICE_FLOOR = 50_000

/**
 * Rows (id + freshness inputs) of the active for-sale listings worth surfacing in
 * the sitemap as individual `/aircraft/listing/[id]` detail pages. Gated to
 * `status='active'` AND `asking_price >= SITEMAP_PRICE_FLOOR`, so the ~200 sub-$50k
 * parts/projects and the no-price rows never enter the sitemap. Paginated in
 * 1000-row batches so the result is NOT silently capped at PostgREST's default row
 * limit (the for-sale table can exceed 1000 priced rows). Internal try/catch →
 * `[]` on any failure, so a sitemap build never aborts on this query.
 */
export async function getForSaleListingSitemapRows(): Promise<
  { id: string; last_seen_at: string | null; created_at: string | null; price_changed_at: string | null }[]
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return []

  type Row = { id: string; last_seen_at: string | null; created_at: string | null; price_changed_at: string | null }
  try {
    const supabase = await createServerSupabaseClient()
    const PAGE = 1000
    const rows: Row[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('aircraft_for_sale')
        .select('id, last_seen_at, created_at, price_changed_at')
        .eq('status', 'active')
        .gte('asking_price', SITEMAP_PRICE_FLOOR)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      rows.push(...(data as Row[]))
      if (data.length < PAGE) break
    }
    return rows
  } catch {
    return []
  }
}

/**
 * Fetch several for-sale aircraft by id, returned in the SAME order as the input
 * ids (so the compare columns match the order the user picked). Missing/invalid
 * ids are silently dropped. Reuses `getAircraftForSaleById` (single source of
 * truth) rather than a new query path.
 */
export async function getAircraftForSaleByIds(ids: string[]): Promise<AircraftForSale[]> {
  const results = await Promise.all(ids.map((id) => getAircraftForSaleById(id)))
  return results.filter((p): p is AircraftForSale => p !== null)
}
