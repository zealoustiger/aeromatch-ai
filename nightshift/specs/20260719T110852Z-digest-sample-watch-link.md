# One-tap "Watch this listing" on digest sample cards

## Goal
Add a one-click "Watch this listing →" link to each aircraft-for-sale sample
card in an alert digest email, so the highest-intent moment in the funnel (a
subscriber looking at a specific matched aircraft) can convert into a
listing-specific watch alert (price-drop + availability) with zero friction.

## Scope
- `src/lib/email.ts` — `AlertDigestSample.watchUrl` field; render it in
  `sampleCardHtml` (HTML) and both plain-text sample-line builders
  (`buildAlertDigestEmail`, `buildCombinedAlertDigestEmail`).
- `src/app/api/cron/alert-digest/route.ts` — new `attachWatchLinks` helper
  that builds a tokenized `digest-cross-sell` link per aircraft sample,
  skipping any listing the subscriber already has a confirmed watch alert
  for (one query against `alerts.source_path`); wired into the single per-
  alert loop so it covers both the single-alert and combined-digest send
  paths for free.
- `src/app/api/alerts/digest-cross-sell/route.ts` — allowlist a new
  `digest_sample_watch` source tag for per-placement analytics.
- No schema change. No new route. `/alerts/status`'s existing
  `cross_sell_added` state + `AlertStatusTracker` already fire
  `alert_subscribed` for this endpoint's redirect — reused as-is.

## Acceptance criteria
- A digest email with aircraft-for-sale samples (new-listing or price-drop)
  renders a "Watch this listing →" link on each sample card, distinct from
  the existing "Not relevant?" link, never nested inside the card's own
  `<a>` (invalid HTML).
- The link is a tokenized GET to `/api/alerts/digest-cross-sell` with
  `path=/aircraft/listing/{id}`, `source=digest_sample_watch`, and a
  `context` naming the listing — clicking it one-taps a confirmed watch
  alert with no second opt-in email (same mechanism as the existing
  cross-sell suggestion).
- No link renders for a sample the subscriber already has a confirmed watch
  alert on (de-duped against `alerts.source_path` for that email).
- No link renders for partnership/seeker samples, or when the alert has no
  `unsubscribe_token` yet (pre-migration row) — never a broken/unauthenticated
  link.
- Existing "Not relevant?" links, dedupe-across-sections behavior, and every
  other digest email affordance are unchanged.
- `npx next build` + `tsc --noEmit` pass; full `node --test` suite passes
  with new coverage for `attachWatchLinks`-equivalent rendering behavior.

## Out of scope
- Watch links on partnership or seeker digest samples (no per-listing watch
  alert type exists for those today).
- Any change to `/alerts/status` copy/rendering (already generic enough).
- Gentle inter-send cron pacing (separate, already-flagged follow-up).
