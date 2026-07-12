# alert-digest-combine

## Goal
When the alert-digest cron finds more than one due alert for the same subscriber email in one pass, send exactly ONE combined email (with a per-alert section) instead of one email per alert — so a subscriber never gets 2+ separate alert emails in the same inbox on the same cron pass.

## Scope
- `src/lib/email.ts` — add `buildCombinedAlertDigestEmail` (+ `AlertDigestSection` type), a new function alongside the existing `buildAlertDigestEmail`/`buildPriceDropEmail`. Does NOT modify `buildAlertDigestEmail`'s behavior.
- `src/app/api/cron/alert-digest/route.ts` — restructure the `GET` handler: compute each alert's due/match data first (unchanged logic), then group qualifying alerts by `email`; a group of exactly 1 sends via the existing single-alert path (byte-for-byte unchanged: same `bestDrop`/`buildAlertDigestEmail` branching); a group of 2+ sends one `buildCombinedAlertDigestEmail` call.
- `src/app/api/alerts/unsubscribe/route.ts` — `applyUnsubscribe` accepts a comma-separated list of tokens (one per alert included in a combined send) and unsubscribes all of them; single-token calls (the existing case, from every other email type) are unchanged since a 1-element list behaves identically to today's `.eq`.
- `src/lib/email.test.ts` — add unit tests for `buildCombinedAlertDigestEmail`.

## Acceptance criteria
- A subscriber with exactly one due+matching alert in a cron pass still gets the exact same email as today (same builder call path, same bytes) — verified by the fact that the single-alert branch is untouched code.
- A subscriber with 2+ due+matching alerts in one cron pass gets exactly ONE email, with one section per alert (own context line, own honest new/drop counts, own sample cards, own "view" link).
- The combined email's subject states an honest total across all included alerts (never fabricates a single alert's count).
- The combined email's one Unsubscribe link unsubscribes every alert included in that email (not just one) — verified via `applyUnsubscribe`'s multi-token support.
- `last_digest_at` is updated for every alert included in a combined send (not just the first), so none of them re-fire next pass.
- `npx next build` + typecheck pass; the existing `email.test.ts` suite (extended) passes via `node --experimental-strip-types --test src/lib/email.test.ts`.

## Out of scope
- No `frequencyUrl` ("get fewer emails") in the combined email — that's a per-alert daily→weekly toggle and ambiguous across multiple alerts in one send; the Manage-alerts link covers it per-alert instead.
- No change to the `bestDrop` single-listing rich template — combined sends always use the aggregate section style (per backlog item's own scoping).
- No new capture point, no `alert_subscribed` event, no schema change.
