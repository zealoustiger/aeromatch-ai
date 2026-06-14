'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  getCurrentUserListings,
  getMatchesForSeeker,
  getMatchesForPartnership,
} from '@/lib/matching-server'

export interface MatchSummary {
  asSeeker: number
  asOwner: number
  hasSavedSearch: boolean
}

/**
 * Lightweight match summary for the current user, used by the homepage hook.
 * Returns null when logged out so the client can render nothing.
 */
export async function getMatchSummary(): Promise<MatchSummary | null> {
  const { userId, seekers, partnerships } = await getCurrentUserListings()
  if (!userId) return null

  let asSeeker = 0
  for (const s of seekers) asSeeker += (await getMatchesForSeeker(s)).length

  let asOwner = 0
  for (const p of partnerships) asOwner += (await getMatchesForPartnership(p)).length

  let hasSavedSearch = false
  try {
    const supabase = await createServerSupabaseClient()
    const { count } = await supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    hasSavedSearch = (count ?? 0) > 0
  } catch {
    hasSavedSearch = false
  }

  return { asSeeker, asOwner, hasSavedSearch }
}
