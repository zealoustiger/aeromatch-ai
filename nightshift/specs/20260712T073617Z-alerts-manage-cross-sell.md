# alerts-manage-cross-sell

## Goal
Add the "also want alerts for the counterpart?" cross-sell box to `/alerts/manage`
(currently only shown on `/alerts/status` right after confirming), so every digest
email's "Manage alerts" link becomes a growth loop, not just the first confirm.

## Scope
- `src/app/actions.ts`: new `subscribeManageCrossSell(context, sourcePath, token?)`
  server action — proves ownership via `resolveOwnerEmail` (session or the page's
  own `unsubscribe_token` scope, same as every other `/alerts/manage` action), then
  inserts a second already-`confirmed` alert for that email (no second opt-in email),
  idempotent on the `(email, source_path)` unique constraint.
- New `src/components/ManageAlertCrossSell.tsx` — client component mirroring
  `AlertCrossSell.tsx`'s one-click accept/dismiss UI, but scoped to the manage
  page's ownership proof (`token?`) instead of a status-page `confirm_token`.
- `src/app/alerts/manage/page.tsx`: after loading the visitor's alerts, try
  `getCrossSellSuggestion` against each `confirmed` alert's `source_path` (most
  recent first) until one yields a suggestion whose `sourcePath` isn't already
  among the visitor's existing alerts; render at most one `ManageAlertCrossSell`
  box below the alert list when found.
- No schema change — reuses the existing `alerts` table exactly as
  `subscribeToConfirmedAlert` does.

## Acceptance criteria
- A confirmed alert with a real cross-sell candidate (sibling model / adjacent
  state with live inventory / counterpart aircraft↔partnerships) shows exactly
  one cross-sell box on `/alerts/manage`, both signed-in and token-scoped.
- Accepting it inserts a new `confirmed` alert for the same email with zero
  extra opt-in email, fires `alert_subscribed` with `source: 'manage_cross_sell'`,
  and flips the box to a "you're set" state.
- A visitor whose alerts already cover every candidate suggestion (or who has
  no confirmed alerts) sees no box — never a forced/duplicate suggestion.
- Dismissing ("No thanks") hides the box for that page view without any request.
- `npx next build` + typecheck pass.
- QA smoke on `/alerts/manage` (bare, `?token=`) at desktop 1280 + mobile 375:
  0 console errors, 0 overflow, HTTP 200.
- Any test alert rows created for verification are deleted afterward.

## Out of scope
- The partnership buy-in-drop digest-email preview-card parity item (separate
  BACKLOG entry, email-template work, not this page).
- Any change to the `/alerts/status` cross-sell (already shipped, untouched).
