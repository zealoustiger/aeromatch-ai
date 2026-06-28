# Spec: post-publish-success

**Timestamp:** 20260628T065939Z
**Pillar:** Posting (Pillar 1)
**Friction removed:** After posting a partnership or seeking listing, users land on their listing page with no confirmation and no next step. The posting flow feels incomplete — "did it work? what do I do now?" Aircraft already solved this with `?posted=1` + a green banner; partnership and seeking don't have it yet.

## Goal
Show a post-publish success banner on partnership and seeking listing pages immediately after posting, matching the pattern that already works on `/aircraft/listing/[id]?posted=1`. The banner confirms the listing is live and gives one smart next-step CTA (browse pilots seeking / browse partnerships nearby).

## Scope
3 files:
1. `src/app/actions.ts` — append `?posted=1` to `createPartnership` and `createSeekerListing` redirects
2. `src/app/partnerships/[id]/page.tsx` — read `searchParams.posted`, render success banner when `'1'`
3. `src/app/partnerships/seeking/[id]/page.tsx` — read `searchParams.posted`, render success banner when `'1'`

## Acceptance criteria
1. After posting a partnership, the user lands on `/partnerships/{id}?posted=1` and sees a green "Your partnership is live!" banner near the top of the page.
2. The partnership success banner includes: one-line explanation ("Pilots can now find you when searching for partnerships near {airport}") + a CTA "Browse pilots seeking partnerships →" linking to `/partnerships/seeking` (optionally filtered by home airport).
3. After posting a seeking listing, the user lands on `/partnerships/seeking/{id}?posted=1` and sees a green "Your seeking listing is live!" banner.
4. The seeking success banner includes: one-line explanation + a CTA "Browse partnerships near you →" linking to `/partnerships?airport={home_airport}`.
5. Visiting either detail page WITHOUT `?posted=1` shows no banner (normal user view is unchanged).
6. `npx next build` compiles clean (zero TypeScript errors).
7. QA smoke passes on `/partnerships/{id}` and `/partnerships/seeking/{id}` (HTTP 200, zero app-origin console errors, zero horizontal overflow at desktop 1280 + mobile 375).

## Out of scope
- Changing the aircraft post-publish banner (already works)
- Adding share-link copy button to the banner (separate slice)
- Email notification after posting (separate slice, needs RESEND_API_KEY)
- Any schema or database changes
