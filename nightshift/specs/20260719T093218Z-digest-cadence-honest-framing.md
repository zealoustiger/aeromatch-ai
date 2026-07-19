# digest-cadence-honest-framing

## Goal
Make the single-alert digest email's body/preheader copy name the subscriber's real
cadence ("yesterday" / "this week" / "this month") instead of always hardcoding "this
week," matching the honest per-frequency `periodLabel` the price-drop email already computes.

## Scope
- `src/lib/email.ts` — `buildAlertDigestEmail`: add an optional `periodLabel?: string`
  (default `'this week'`, so every existing call/test stays byte-exact) and thread it into
  the aggregate (non-sample, non-first-send) `bodyCopy` and `preheaderText` strings (both
  currently hardcode "this week" at what's roughly lines 1130/1178).
- `src/app/api/cron/alert-digest/route.ts` — the single-alert send path (`buildAlertDigestEmail`
  call, ~line 1802) already has `frequency` in scope; pass
  `periodLabel: frequency === 'daily' ? 'yesterday' : frequency === 'monthly' ? 'this month' : 'this week'`
  — the exact expression already used for the sibling `buildPriceDropEmail` call a few lines
  above (~line 1797).
- `src/lib/email.test.ts` — add cases asserting the default stays "this week" (no regression)
  and that `periodLabel: 'yesterday'` / `'this month'` override both the HTML body and the
  preheader text.

## Out of scope
- `buildCombinedAlertDigestEmail` — verified by direct code read that its per-section body/
  preheader copy never says "this week" (or any period word) at all today, so there is nothing
  to fix there.
- `buildAdminAlertFunnelEmail`'s many "this week" strings — that's an internal admin report
  with its own real weekly cadence (the Monday cron), not subscriber-facing, and out of scope
  for this alert-experience honesty fix.
- Any other batch #9 item (post-subscribe max-price refine, watch-unavailable one-tap alert,
  bounced-hint on resend, dormant re-permission) — separate slices, left for future cycles.

## Acceptance criteria
- `buildAlertDigestEmail`'s default behavior (no `periodLabel` passed) is byte-identical to
  today — every existing test still passes unmodified.
- Passing `periodLabel: 'yesterday'` changes both the HTML `bodyCopy` and the preheader
  `<div style="display:none...">` text to say "yesterday" instead of "this week"; same for
  `'this month'`.
- The live cron (`alert-digest/route.ts`) computes and passes the frequency-aware label on
  every single-alert send, so a daily subscriber's email says "yesterday," weekly says "this
  week" (unchanged), monthly says "this month."
- `npx tsc --noEmit` and `npx next build` both pass; the full `node --test` suite passes,
  including the new cases.
- QA smoke passes on the affected pages (this is a non-visual, email-body-only change — no
  page markup changes) using the dev-only email-preview route to visually confirm the label
  swap, not the screenshots-reading gate.
