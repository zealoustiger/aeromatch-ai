# alert-confirm-manage-link

## Goal
Give the very first alert email a subscriber ever receives (the double-opt-in
confirmation email) — and the `/alerts/status` confirmed panel — a one-click path
to `/alerts/manage`, matching the "Manage alerts" link already present in the
digest and price-drop emails.

## Scope
- `src/lib/email.ts` — `buildAlertConfirmEmail(opts)`: add a `manageUrl: string`
  option; render a "Manage alerts" link (same style/placement precedent as
  `buildAlertDigestEmail`/`buildPriceDropEmail`) in both the HTML and plain-text
  bodies, next to/above the existing Unsubscribe line.
- `src/app/actions.ts` — both call sites of `buildAlertConfirmEmail`
  (`subscribeToAlerts` and `sendConfirmationResend`): build
  `manageUrl = ${SITE_URL}/alerts/manage?token=${unsubscribeToken}` (mirrors the
  exact convention `alert-digest/route.ts` already uses) and pass it through.
- `src/app/alerts/status/page.tsx` — in the `key === 'confirmed' && token` branch,
  add a "Manage your alerts" link to `/alerts/manage?token=${token}` (the page's
  `token` param here is the `confirm_token`, which is NOT the manage token — need
  to fetch the row's `unsubscribe_token` alongside the existing `source_path`
  select in the cross-sell lookup, since the manage page authenticates via
  `unsubscribe_token`, not `confirm_token`).

## Acceptance criteria
- Confirmation email now includes a working "Manage alerts" link (both HTML and
  plain-text) pointing at `/alerts/manage?token=<unsubscribe_token>`.
- `/alerts/status?state=confirmed&token=<confirm_token>` renders a "Manage your
  alerts" link that resolves to the same subscriber's `/alerts/manage?token=...`
  using their real `unsubscribe_token`, not the confirm token.
- No schema change (reuses the existing `unsubscribe_token` column, already
  selected/used elsewhere).
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on `/alerts/status` (all 3 states) and `/alerts` at desktop
  1280 + mobile 375, zero app console errors, zero overflow.
- Non-visual/minor-visual cycle (one new link, existing panel layout) — screenshots
  read to sanity-check the added link renders correctly.

## Out of scope
- Any change to the digest/price-drop email templates (already have `manageUrl`).
- Resend confirmation flow's UI (only the email content/link changes).
- The `alert-signin-one-click` state-detection item, footer alerts link, or any
  other open `[P1]/[P2][goal]` backlog item — separate slices.
