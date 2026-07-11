# alert-cross-sell-nearby-state

## Goal
Add the last un-built suggestion type to the post-confirmation alert cross-sell on
`/alerts/status`: when a just-confirmed alert's criteria include a `state`, offer an
adjacent state with real, non-zero live inventory.

## Scope
- `src/lib/alertCrossSell.ts` — extend `parseNounAndMake` to capture `state`; add a
  small curated `ADJACENT_STATES` map (same 10-state curated set used elsewhere:
  ca/tx/fl/az/co/wa/ny/il/ga/nc); add `getNearbyStateSuggestion` that walks the
  adjacency list and uses `getAlertMatchCount` (existing, from `alertMatchCounts.ts`)
  to find the first neighbor with count > 0 — never suggest an empty state. Make
  `getCrossSellSuggestion` async (it now needs a DB read) and try, in order: (1)
  existing sibling-model suggestion, (2) new nearby-state suggestion when a state is
  present, (3) existing make-counterpart fallback.
- `src/app/alerts/status/page.tsx` — `await` the now-async `getCrossSellSuggestion`.
- No component change needed — `AlertCrossSell.tsx` already renders any
  `AlertCrossSellSuggestion` generically, and `subscribeToConfirmedAlert` already
  accepts an arbitrary `context`/`sourcePath`.

## Acceptance criteria
- A confirmed aircraft or partnership alert whose `source_path` includes `state=XX`
  (and no sibling-model match) shows "Also want alerts for {make} in {State}? N
  {listings|pilots} now" when an adjacent state has ≥1 real active match.
- Never renders a suggestion for a state with 0 real matches (checked live via
  `getAlertMatchCount`, not fabricated).
- Existing sibling-model and make-counterpart suggestions are unaffected (unmodeled /
  no-state alerts behave exactly as before).
- Accepting the suggestion creates a second `confirmed` alert via the existing
  `subscribeToConfirmedAlert` action and fires `alert_subscribed` with
  `source: 'cross_sell'` (already wired in `AlertCrossSell.tsx`, untouched).
- `npx tsc --noEmit` and `npx next build` pass.
- QA smoke passes on `/alerts/status` (desktop 1280 + mobile 375, HTTP 200, no
  console errors, no overflow).

## Out of scope
- Any change to the sibling-model curated map or the make-counterpart fallback logic.
- A UI for the visitor to pick which adjacent state (single best pick only, matching
  the existing sibling-model/counterpart single-suggestion pattern).
- Seeker-type alerts (unchanged — no suggestion, same as today).
