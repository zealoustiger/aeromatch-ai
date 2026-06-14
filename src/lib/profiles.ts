import { createServerSupabaseClient } from './supabase-server'
import { Profile, ListingReview, ReviewTargetType } from './types'

/**
 * Server-side data access for profiles + listing reviews.
 *
 * These tables ship in migration 0001 and may not exist yet in a given database.
 * Every function FAILS SOFT — a missing table (or any query error) yields an empty
 * result rather than throwing, so pages render an empty state and `npm run build`
 * and existing pages are unaffected.
 */

function hasSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'https://placeholder.supabase.co'
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!userId || !hasSupabase()) return null
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}

/** Batch-fetch profiles keyed by user_id (for author identity on lists). */
export async function getProfilesMap(userIds: (string | null | undefined)[]): Promise<Record<string, Profile>> {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))]
  if (ids.length === 0 || !hasSupabase()) return {}
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from('profiles').select('*').in('user_id', ids)
    if (error || !data) return {}
    const map: Record<string, Profile> = {}
    for (const p of data as Profile[]) map[p.user_id] = p
    return map
  } catch {
    return {}
  }
}

export interface ReviewWithAuthor extends ListingReview {
  author: Profile | null
}

export async function getReviews(
  targetType: ReviewTargetType,
  targetId: string
): Promise<ReviewWithAuthor[]> {
  if (!targetId || !hasSupabase()) return []
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    const reviews = data as ListingReview[]
    const authors = await getProfilesMap(reviews.map((r) => r.author_user_id))
    return reviews.map((r) => ({ ...r, author: authors[r.author_user_id] ?? null }))
  } catch {
    return []
  }
}

/** Whether the given user has already reviewed this target (fail-soft → false). */
export async function hasReviewed(
  targetType: ReviewTargetType,
  targetId: string,
  userId: string
): Promise<boolean> {
  if (!userId || !hasSupabase()) return false
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('listing_reviews')
      .select('id')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('author_user_id', userId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
