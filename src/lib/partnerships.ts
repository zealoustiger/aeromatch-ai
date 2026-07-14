import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Partnership } from '@/lib/types'
import { MOCK_PARTNERSHIPS } from '@/lib/mockData'

/**
 * Shared fetch for the most-recent active partnerships.
 *
 * Single source of truth so any surface that wants to show a few real available
 * partnership cards (the homepage "Newest partnerships" rail, the seeking-page
 * empty-state fallback, etc.) reuses the same query instead of duplicating it.
 * Mirrors the listing query in PartnershipList: status='active', newest first.
 */
export async function getLatestPartnerships(limit: number, photoOnly = false): Promise<Partnership[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) return MOCK_PARTNERSHIPS.slice(0, limit)

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'active')
    // photoOnly: homepage cards must show a real photo, never the make placeholder.
    if (photoOnly) query = query.eq('image_is_placeholder', false)
    const { data } = await query
      // Real-photo listings first so the homepage leads with credible imagery,
      // then newest within each group.
      .order('image_is_placeholder', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  } catch {
    return []
  }
}

/**
 * Shared single-listing fetch. The partnership detail page used to inline this
 * query; it's extracted here so other surfaces (the `/compare` view) reuse the
 * exact same fetch instead of duplicating it. Returns null for a missing id.
 */
export async function getPartnershipById(id: string): Promise<Partnership | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) {
    return MOCK_PARTNERSHIPS.find((p) => p.id === id) ?? null
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('partnerships').select('*').eq('id', id).single()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch a CLOSED (i.e. filled/taken-down) partnership by id via the service-role
 * client, bypassing the `status='active'` RLS read policy (`partnerships_public_read`).
 * Mirrors `getSoldAircraftForSaleById` in `src/lib/aircraftForSale.ts`: used only by
 * the detail route's closed-state fallback, so a filled partnership renders a proper
 * "this partnership has been filled" page (200 + noindex) instead of a bare 404 on a
 * URL Google may have already indexed.
 *
 * Deliberately scoped to `status='closed'` ONLY — not a blanket `neq('active')` —
 * because `partnerships.status` also has `'pending'` (awaiting moderation, never
 * public yet) and `'admin'` (ingested but intentionally admin-only/hidden from the
 * public marketplace, see `src/lib/types.ts`'s `Partnership.status` comment). Neither
 * of those was ever a real public listing, so surfacing them here would leak
 * unvetted/gated content onto a public URL under dishonest "this was filled" copy.
 * Returns null for a genuinely missing id, or a pending/admin one (→ real 404).
 * Server-only.
 */
export async function getClosedPartnershipById(id: string): Promise<Partnership | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  if (!hasSupabase) return null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('partnerships')
      .select('*')
      .eq('id', id)
      .eq('status', 'closed')
      .single()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch several partnerships by id, returned in the SAME order as the input ids
 * (so the compare columns match the order the user picked). Missing/invalid ids
 * are silently dropped — callers handle the "fewer than asked for" case. Reuses
 * `getPartnershipById` (single source of truth) rather than a new query path.
 */
export async function getPartnershipsByIds(ids: string[]): Promise<Partnership[]> {
  const results = await Promise.all(ids.map((id) => getPartnershipById(id)))
  return results.filter((p): p is Partnership => p !== null)
}
