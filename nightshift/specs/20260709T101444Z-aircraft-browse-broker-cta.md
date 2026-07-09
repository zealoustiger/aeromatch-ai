# Spec: aircraft-browse-broker-cta

## Goal
Add the existing honest "Work with a broker" fake-door monetization CTA to the `/aircraft`
browse/search-results page, the one named remaining gap flagged by the `monetization-services-cta`
cycle ("Not done, intentionally: the `/aircraft` results-page placement — a natural next slice").

## Scope
- `src/app/aircraft/page.tsx` — import `MonetizationIntent` (already used identically on
  `/aircraft/listing/[id]` and `/partnerships/[id]`) and render one broker CTA below the
  existing inline `AlertSignup` block, gated the same way (`itemListListings.length > 0`, so it
  never appears on an empty-result page — the empty state has its own priorities).
- No other files. No new component (reuse `MonetizationIntent` verbatim, same `path="broker"`,
  same copy as the two existing placements for consistency).
- No schema change, no new dependency, no new waitlist `source` value beyond the existing
  `"broker"` path already handled by `joinWaitlist`.

## Acceptance criteria
- `/aircraft` with results renders a "Work with a broker" button below the alert-signup box
  (same position pattern as the detail-page CTA, adapted to the browse-page layout).
- Clicking it opens the "Coming soon — want early access?" modal and fires the
  `monetization_intent` event with `path: "broker"` (same behavior as the existing two
  placements — verified by code parity, not a new event).
- Submitting a real email in the modal upserts a `waitlist` row via `joinWaitlist(email, '', 'broker')`
  exactly as the existing call sites do — no new server-action logic.
- The CTA does NOT render when the filtered result list is empty (avoids clutter on an
  already-sparse empty state).
- `npx next build` + `npx tsc --noEmit` clean.
- QA smoke passes on `/aircraft` (and one filtered URL, e.g. `/aircraft?make=Cessna`) at
  desktop 1280 + mobile 375: HTTP 200, zero app-console errors, zero horizontal overflow.
- Visual cycle — screenshots confirm the CTA renders cleanly, doesn't collide with the
  aggregation-disclosure text or the "browse by state" section below it.

## Out of scope
- Any other monetization CTA (financing/insurance/escrow/prebuy) on the browse page — only
  the broker CTA, matching the one flagged gap.
- `/partnerships` browse page placement (not requested by the flagged follow-up; a separate
  future slice if wanted).
- Any change to `MonetizationIntent.tsx`, `joinWaitlist`, or the `waitlist` table/schema.
