# Wire `buildPriceDropEmail` into the live digest cron

## Goal
When a confirmed aircraft alert's digest window contains a genuine price drop and no
new listings, send the rich single-listing `buildPriceDropEmail` template (already built
and unit-tested, currently only reachable via the dev preview route) instead of the bare
aggregate digest's "+1 price drop" count line.

## Scope
- `src/app/api/cron/alert-digest/route.ts` — in the per-alert send loop, when
  `target.type === 'aircraft'`, the alert is opted into price-drop alerts, `dropCount > 0`,
  and `newCount === 0` (this send is purely about a drop, nothing new to report), pick the
  single best price-drop sample (largest genuine % decrease among the up to 3 fetched
  price-drop samples) and build the email with `buildPriceDropEmail` instead of
  `buildAlertDigestEmail`. Every other case (new listings present, no drop, non-aircraft
  target, opted out, or — as a safety net — a `dropCount > 0` with no fetched samples)
  keeps sending the existing aggregate `buildAlertDigestEmail`, unchanged.
- `src/lib/email.ts` — no changes; reuse `buildPriceDropEmail` as-is.
- `src/lib/email.test.ts` — add unit coverage for the new selection logic if it's factored
  into a small pure helper (picking the best of N drop samples by % decrease).

## Acceptance criteria
- An aircraft alert with `dropCount > 0` and `newCount === 0` sends `buildPriceDropEmail`'s
  subject/html/text (verified by unit test / direct call, not a live send).
- The featured listing is the one with the largest genuine `%` price decrease among the
  fetched samples, not just the most recent.
- An aircraft alert with both new listings and a drop (`newCount > 0`) is unaffected —
  still gets the existing aggregate digest listing both counts (never silently drops the
  new-listing information).
- Partnership and seeker alerts are unaffected — always the aggregate digest (partnerships
  have no per-listing rich template yet).
- `last_digest_at` bookkeeping, `sendEmail` call, and opt-in / graceful-degrade logic are
  unchanged.
- `npx next build` (typecheck + build) is clean.

## Out of scope
- Top-N cards in the price-drop template (single best listing only, per the backlog slice).
- Partnership buy-in drops getting the rich single-listing template (they have none).
- Any change to the opt-in toggle, digest frequency, or sample-fetching queries themselves.
