# partnership-listing-reviews

## Goal
Let a signed-in pilot leave a rating + written review on a partnership listing, and
show existing reviews on that listing's detail page — the `listing_reviews` table has
existed live since 2026-06-22 (migration `profiles_and_reviews`) but has zero UI built
on it.

## Scope
- `src/lib/reviewValidation.ts` (new, pure) — body length + lightweight profanity check,
  rating range validator. Unit-tested.
- `src/lib/reviews.ts` (new) — `getReviews(targetType, targetId)` (visible reviews +
  batched author `profiles` lookup via existing `getPublicProfile`), `hasReviewed(...)`.
  Uses the normal RLS-respecting `createServerSupabaseClient()` — confirmed live via a
  direct anon-key probe this cycle: `select` on `listing_reviews` succeeds (public-read
  policy live), unauthenticated `insert` correctly 401s with `42501` (RLS policy live) —
  so no service-role workaround is needed, unlike some earlier alerts-table slices.
- `src/app/actions.ts` — new `postReview(input: {targetId, rating, body})` server action,
  scoped to `target_type: 'partnership'` only this slice (matches the exact backlog
  wording: "leave a review on a completed partnership"). Blocks self-review (looks up
  `partnerships.poster_id`), blocks duplicate review (DB unique constraint + friendly
  `23505` message), validates via `reviewValidation.ts`, inserts as the authenticated
  user (`author_user_id = auth.uid()`), revalidates the partnership's detail path.
- `src/components/ReviewForm.tsx` (new, client) + `src/components/ReviewsSection.tsx`
  (new, server) — star-rating input (optional) + textarea, list of existing reviews
  (author name/avatar linking to `/pilots/[id]` when they have a profile, date,
  stars, body), gated: sign-in prompt / "can't review your own listing" / "already
  reviewed" / the form. Styled with the site's existing `ch-panel` cream tokens (not
  the old slate/sky reference PR's raw TailwND — this repo already has a design system).
- `src/app/partnerships/[id]/page.tsx` — wire `<ReviewsSection>` in after
  `<SimilarListings>`, before `<PartnershipLaunchBanner>`.

## Acceptance criteria
- `/partnerships/[id]` renders a "Reviews" section: empty state when 0 reviews, a
  signed-out visitor sees a "sign in to review" prompt (no form), the listing owner
  sees "you can't review your own listing," a signed-in non-owner who hasn't reviewed
  yet sees the form.
- Submitting a valid review (rating optional, body 3–2000 chars) creates a
  `listing_reviews` row and the new review appears in the list without a full reload.
- Submitting a 2nd review on the same listing as the same user is rejected with a
  friendly message (DB unique constraint surfaced, not a raw Postgres error).
- `npx tsc --noEmit` and `npx next build` both clean.
- No console errors / no 375px horizontal overflow on `/partnerships/[id]`
  (`qa-smoke.mjs`).
- Any real test review row created for QA is deleted before the cycle ends.

## Out of scope
- `partnership_seekers` (`target_type: 'seeker'`) reviews — a natural next slice,
  the schema already supports it but the seeker page has its own anonymity
  considerations (`anonymizeName`) worth a dedicated look.
- Admin moderation UI for `status='hidden'` — the column exists, no admin surface yet.
- Aggregate rating badge on `PartnershipCard` / browse pages — a follow-up once real
  reviews exist to aggregate.
