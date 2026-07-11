# Token-scoped alert management for email-only subscribers

## Goal
Let an email-only alert subscriber (no account — the majority, since ClubHanger's
core alert promise is "one email, no account required") manage their alerts
(pause/resume/delete/edit criteria/toggle price-drop/toggle frequency) from the
weekly digest email's "Manage alerts" link, without hitting the sign-in wall
`/alerts/manage` currently forces on everyone.

## Scope
- `src/app/actions.ts`: add a shared `resolveOwnerEmail(admin, token?)` helper
  (token → resolve via `unsubscribe_token`; no token → resolve via session
  `getUser()`, same as today). Generalize `loadOwnedAlert(id, token?)` and thread
  an optional `token?: string` param through `pauseAlert`, `resumeAlert`,
  `deleteAlert`, `updateAlertCriteria`, `updateAlertPriceDropOptIn`,
  `updateAlertFrequency`, `resendAlertConfirmation`.
- `src/app/alerts/manage/page.tsx`: read `?token=` from `searchParams`. If no
  session but a token resolves to a real alert's email, render that email's
  alerts (same query as the signed-in path) instead of the sign-in wall; an
  invalid token shows "This link is no longer valid" instead of the generic
  sign-in copy. A signed-in session always takes priority over a stray token
  query param (never forward a foreign token to a signed-in user's actions).
- `src/components/AlertActions.tsx`, `AlertEditForm.tsx`, `PriceDropToggle.tsx`,
  `FrequencyToggle.tsx`: add an optional `token` prop, forwarded to the action
  call so the button clicks work token-scoped.
- `src/app/api/cron/alert-digest/route.ts`: the digest email's `manageUrl`
  becomes `${SITE_URL}/alerts/manage?token=${alert.unsubscribe_token}` instead
  of the bare, dead-ending `/alerts/manage` (falls back to the bare URL if a
  row has no token yet).
- No schema change, no new DB columns — reuses the existing `unsubscribe_token`
  column and the exact "public, token-scoped ownership" precedent
  `pauseAlertByToken` already established.

## Acceptance criteria
- Visiting `/alerts/manage?token=<a real alert's unsubscribe_token>` while
  signed out renders that email's full alert list (not the sign-in wall), with
  working Pause/Resume/Delete/Edit/price-drop/frequency controls.
- Visiting `/alerts/manage?token=<garbage>` while signed out shows "This link
  is no longer valid" (not a crash, not the alert list).
- Visiting `/alerts/manage` with no token and signed out still shows today's
  sign-in wall unchanged.
- A signed-in user visiting `/alerts/manage` (with or without a stray `token`
  query param) still sees and manages only their own session-scoped alerts —
  never a foreign token's alerts.
- The weekly digest email's "Manage alerts" link now carries `?token=`.
- `npx next build` + typecheck pass; QA smoke clean on `/alerts/manage`
  (bare, `?token=<valid>`, `?token=<invalid>`) at desktop 1280 + mobile 375.

## Out of scope
- Adding a "Manage alerts" link to the confirm email (it has none today) —
  separate, smaller follow-up.
- The other two open `[P1][goal]` items this cycle (signed-in one-click
  capture; wiring `buildPriceDropEmail` into the cron) — next cycles.
