const PROFANITY = ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'bastard', 'dick']

export interface ReviewInput {
  body: string
  rating: number | null
}

/** Pure validation for a listing review, shared by the server action and its
 *  tests. Mirrors the `listing_reviews` DB check constraints (body 1-2000
 *  chars, rating 1-5) plus a light profanity guard — never trusts the client. */
export function validateReview(input: ReviewInput): string | null {
  const body = input.body.trim()
  if (body.length < 3) return 'Please write at least a few words.'
  if (body.length > 2000) return 'Review is too long (2000 character max).'
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    return 'Rating must be 1–5.'
  }
  const lower = body.toLowerCase()
  if (PROFANITY.some((w) => new RegExp(`\\b${w}`, 'i').test(lower))) {
    return 'Please keep your review professional.'
  }
  return null
}
