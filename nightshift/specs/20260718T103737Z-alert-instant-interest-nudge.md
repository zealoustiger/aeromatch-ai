# alert-instant-interest-nudge

## Goal
Add an honest, non-selectable "Instant — interested?" affordance next to the
`FrequencyToggle` on `/alerts/manage` that captures real demand data for
within-the-hour alerts, since the real instant-sends feature is blocked on a
human Vercel-tier decision (see BACKLOG.md `[P1][goal]` "Instant-alerts demand
probe on the frequency picker").

## Scope
- `src/app/actions.ts` — new server action `recordInstantAlertInterest(id, token?)`,
  reusing the existing `loadOwnedAlert` ownership-proof helper (same pattern as
  `updateAlertFrequency`/`pauseAlert`), inserting one row into the existing
  `feedback` table (`type: 'instant_alert_interest'`, no schema change).
- `src/components/InstantInterestNudge.tsx` — new client component, mirrors
  `WidenAlertNudge`'s local-state confirmation swap (no page reload). Fires
  `track('instant_alert_interest', { alert_id })` (existing `@/lib/analytics`
  wrapper, same pattern as `alert_subscribed`) once the insert succeeds.
- `src/app/alerts/manage/page.tsx` — render `<InstantInterestNudge>` next to
  `<FrequencyToggle>` in each alert row's badge line.

## Acceptance criteria
- Every alert row on `/alerts/manage` (token-scoped and signed-in) shows an
  "Instant — interested?" pill next to the Daily/Weekly `FrequencyToggle`.
- Tapping it, without a page reload: inserts a `feedback` row
  (`type='instant_alert_interest'`, real `email`/`page_path` from the owned
  alert) and swaps the button for an inline "Thanks — noted!" confirmation.
- Fires a `instant_alert_interest` PostHog event with the alert id on success.
- Never renders "Instant" as an actual selectable frequency — `FrequencyToggle`
  itself is untouched (still only Daily/Weekly).
- `npx tsc --noEmit` and `npx next build` both pass.
- QA: `qa-smoke.mjs` clean on `/alerts/manage` at desktop 1280 + mobile 375,
  zero console errors, zero overflow. Visual cycle — screenshots read into the
  verdict.

## Out of scope
- Actually building instant/near-real-time sends (blocked on the Vercel-tier
  human call, tracked separately in BACKLOG.md).
- Surfacing the interest count anywhere (admin rollup) — follow-up noted in
  the backlog item, not this slice.
