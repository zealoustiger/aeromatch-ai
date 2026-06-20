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
