import Link from 'next/link'
import { Star, MessageSquare } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getReviews } from '@/lib/profiles'
import type { ReviewTargetType } from '@/lib/types'
import VerifiedBadge from './VerifiedBadge'
import ReviewForm from './ReviewForm'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rating ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-slate-300'}
        />
      ))}
    </span>
  )
}

/**
 * Reviews + comments for a partnership or seeker listing. Reads visible reviews,
 * renders author identity, and lets a signed-in non-owner post one. Fails soft:
 * if the listing_reviews table doesn't exist yet, the list is simply empty.
 */
export default async function ReviewsSection({
  targetType,
  targetId,
  ownerId,
}: {
  targetType: ReviewTargetType
  targetId: string
  ownerId: string | null
}) {
  const reviews = await getReviews(targetType, targetId)

  let currentUserId: string | null = null
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    currentUserId = user?.id ?? null
  } catch {
    currentUserId = null
  }

  const isOwner = !!currentUserId && currentUserId === ownerId
  const alreadyReviewed = !!currentUserId && reviews.some((r) => r.author_user_id === currentUserId)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <MessageSquare className="h-4 w-4" />
        Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
      </h2>

      {/* Post / gate */}
      {!currentUserId ? (
        <p className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          <Link href="/auth" className="font-medium text-sky-700 hover:underline">
            Sign in
          </Link>{' '}
          to leave a review.
        </p>
      ) : isOwner ? (
        <p className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          This is your listing — you can’t review your own listing.
        </p>
      ) : alreadyReviewed ? (
        <p className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          You’ve already reviewed this listing. Thanks!
        </p>
      ) : (
        <div className="mb-6">
          <ReviewForm targetType={targetType} targetId={targetId} />
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">No reviews yet — be the first to share your experience.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => {
            const name = r.author?.display_name ?? 'ClubHanger Pilot'
            return (
              <li key={r.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  {r.author ? (
                    <Link href={`/pilots/${r.author_user_id}`} className="text-sm font-semibold text-slate-800 hover:text-sky-700">
                      {name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">{name}</span>
                  )}
                  {r.author?.verified && <VerifiedBadge />}
                  {r.rating != null && <Stars rating={r.rating} />}
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{r.body}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
