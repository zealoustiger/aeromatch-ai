import { createServerSupabaseClient } from '@/lib/supabase-server'
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
export async function getLatestPartnerships(limit: number): Promise<Partnership[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'

  if (!hasSupabase) return MOCK_PARTNERSHIPS.slice(0, limit)

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('partnerships')
      .select('*')
      // Real-photo listings first so the homepage leads with credible imagery,
      // then newest within each group.
      .eq('status', 'active')
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
 * Fetch several partnerships by id, returned in the SAME order as the input ids
 * (so the compare columns match the order the user picked). Missing/invalid ids
 * are silently dropped — callers handle the "fewer than asked for" case. Reuses
 * `getPartnershipById` (single source of truth) rather than a new query path.
 */
export async function getPartnershipsByIds(ids: string[]): Promise<Partnership[]> {
  const results = await Promise.all(ids.map((id) => getPartnershipById(id)))
  return results.filter((p): p is Partnership => p !== null)
}
