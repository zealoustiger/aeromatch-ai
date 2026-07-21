# digest-feedback-honest-landing

## Goal
Make the digest 👎 landing states (`/alerts/status?state=digest_listing_feedback` and
`?state=digest_feedback_down`) honest and actionable — replace the false "we'll factor
that into your future emails" claim with real, token-scoped narrowing suggestions and a
direct deep link to Edit/mode/frequency for that specific alert.

## Scope
- `src/app/alerts/status/page.tsx`:
  - Add a token→alert lookup (by `unsubscribe_token`, same graceful-degrade `frequency`-
    column pattern already used in the `confirmed`/`unsubscribed` branches) for the
    `digest_listing_feedback` and `digest_feedback_down` states, fetching `id`,
    `source_path`, `frequency`.
  - Compute `getAlertMatchCount` + `getNarrowSuggestions` (both already exist in
    `src/lib/alertMatchCounts.ts`) from that alert's real `source_path`.
  - Render the existing `NarrowAlertNudge` component when an alert row resolves (it
    already renders nothing when `suggestions.length === 0`, so no extra guard needed).
  - Replace the generic bare "Manage your alerts" link for both states with the specific
    deep link `/alerts/manage?token=${unsubscribe_token}&edit=${alertId}#alert-${alertId}`
    (same pattern the digest cron's own per-listing deep link already uses), falling back
    to the plain `/alerts/manage?token=${token}` link when the row can't be resolved
    (expired/invalid token).
  - Rewrite `STATES.digest_listing_feedback.body` copy — drop the false "we'll factor
    that into what shows up in your future alert emails" claim (nothing reads `feedback`
    rows to affect sends) for something true: the vote is noted, and here's how to
    actually change it yourself.
  - `STATES.digest_feedback_down.body` is already honest (no false promise) — left as is;
    only its render logic gains the same suggestions/deep-link treatment.
- No new capture point, no schema change, no changes to `feedback` table or the
  `/api/alerts/digest-feedback` route (it already returns everything needed via `token`).

## Acceptance criteria
- `next build` + `tsc --noEmit` pass clean.
- `digest_listing_feedback`'s copy no longer claims future emails will change based on
  the vote.
- When `token` resolves to a real confirmed alert with a live `source_path`, both
  `digest_listing_feedback` and `digest_feedback_down` states show the real
  `NarrowAlertNudge` suggestions (when the alert is over the narrow threshold) and a
  working `?edit=<id>#alert-<id>` deep link into `/alerts/manage`.
- When `token` is invalid/expired or the row can't be resolved, both states still render
  their existing generic copy + a working (non-broken) `/alerts/manage` link — no crash,
  no dead link.
- No regression to any other state on this page (`confirmed`, `unsubscribed`, `snoozed`,
  etc.) — all existing branches untouched.
- QA smoke passes on `/alerts/status` (desktop 1280 + mobile 375, HTTP 200, zero console
  errors, zero overflow) for at least the `digest_listing_feedback` and
  `digest_feedback_down` states.

## Out of scope
- No changes to the `feedback` table schema or the digest-feedback route.
- No changes to `digest_feedback_up` (positive vote — no honesty issue there).
- No new alert-capture point, no new PostHog event.
- Not building a system that actually reads `feedback` votes to auto-tune sends — the
  fix here is honest copy + surfacing existing self-serve tools, not new ML/heuristics.
