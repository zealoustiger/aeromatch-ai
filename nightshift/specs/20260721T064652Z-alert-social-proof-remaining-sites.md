# alert-social-proof-remaining-sites

## Goal
Wire the existing honesty-gated `alertCount` ("N buyers get alerts for this") social-proof
prop into the remaining `AlertSignup` call sites that have a clean single `context` string,
continuing the `alert-social-proof-hub-pages` / `alert-social-proof-more-pages` multi-cycle
wire-up (BACKLOG's "🔔 Honest 'Join N others' social proof on `AlertSignup`" item).

## Scope
Reuses the existing `getAlertCounts()` (`src/lib/alertCounts.ts`) + `AlertSignup`'s existing
`alertCount` prop — no new mechanism, no schema change. Files:
- `src/app/tools/cost-calculator/page.tsx` — the `make`+`model` branch (`aircraftLabel` context)
- `src/app/aircraft/compare/[comparison]/page.tsx` — both `aLabel`/`bLabel` boxes
- `src/app/compare/page.tsx` — the dynamic (≤3, deduped) `AlertBox[]` list
- `src/app/partnerships/[id]/page.tsx` — `FilledPartnershipPage`'s family/make context box,
  and the main `partnership_detail` sidebar box (NOT the `post_success_partnership`
  seeker-noun box or the `partnership_watch` per-listing box — those stay unwired, matching
  the precedent set on `/aircraft/listing/[id]`'s analogous boxes)
- `src/app/saved/page.tsx` — the `deriveSavedAlertContext` box only

## Acceptance criteria
- Each listed box now computes `alertCount` via `getAlertCounts([...contexts])` (batched
  per page where multiple boxes exist) and passes it as a prop, matching the exact pattern
  already used on `/aircraft/[make]` and `/airports/[icao]`.
- No fabricated numbers: the floor/honesty logic lives entirely inside `getAlertCounts`/
  `AlertSignup` already — this cycle only threads the prop, no new gating logic.
- The excluded boxes (seeker-noun cross-sell, per-listing watch box, no-context boxes) are
  left untouched.
- `npx tsc --noEmit` and `npx next build` both clean.
- QA smoke (desktop 1280 + mobile 375, HTTP 200, zero app-origin console errors, zero
  horizontal overflow) passes on: `/tools/cost-calculator?make=Cessna&model=172`,
  `/aircraft/compare/[a-real-comparison-slug]`, `/compare`, `/partnerships/[a-real-id]`,
  `/saved`.
- Visual cycle — screenshots read and confirm no layout regression.

## Out of scope
- The still-not-applicable multi-context pages (guides, `/tools`, `/aircraft/compare` index,
  `/post`, `/about`, `/not-found`, homepage, `/aircraft/browse`, `/listing-quality`).
- The seeker-noun and per-listing-watch boxes on `/partnerships/[id]` (deliberate precedent).
- Any change to `getAlertCounts`/`AlertSignup`'s honesty-gating logic itself.
