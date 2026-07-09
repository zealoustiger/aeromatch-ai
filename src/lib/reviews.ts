import { createServerSupabaseClient } from './supabase-server'
import { getPublicProfile, type PublicProfile } from './publicProfile'

export type ReviewTargetType = 'partnership' | 'seeker'

export interface ListingReview {
  id: string
  created_at: string
  target_type: ReviewTargetType
  target_id: string
  author_user_id: string
  rating: number | null
  body: string
  status: 'visible' | 'hidden'
}

export interface ReviewWithAuthor extends ListingReview {
  author: PublicProfile | null
}

/** Visible reviews for a listing, newest first, each with its author's public
 *  profile (or null if they never visited /account — same self-suppress
 *  pattern `PosterAttribution` uses). RLS scopes reads to `status = 'visible'`
 *  for anyone, confirmed live via a direct anon-key probe. */
export async function getReviews(
  targetType: ReviewTargetType,
  targetId: string
): Promise<ReviewWithAuthor[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('listing_reviews')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
  if (error || !data) return []

  const reviews = data as ListingReview[]
  const authors = await Promise.all(reviews.map((r) => getPublicProfile(r.author_user_id)))
  return reviews.map((r, i) => ({ ...r, author: authors[i] }))
}

/** Whether the given signed-in user has already reviewed this listing. */
export async function hasReviewed(
  targetType: ReviewTargetType,
  targetId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('listing_reviews')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('author_user_id', userId)
    .maybeSingle()
  return !!data
}
