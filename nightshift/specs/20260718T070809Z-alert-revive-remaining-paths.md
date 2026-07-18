# alert-revive-remaining-paths

## Goal
A visitor who previously unsubscribed from an alert and later re-subscribes through
`subscribeToConfirmedAlert` (status-page cross-sell), `subscribeManageCrossSell`
(manage-page cross-sell), `createManageAlert` (manage page "+ New alert" / Duplicate),
or `subscribeSavedSearchAlert` (`/searches` "Get email alerts") hits a silent 23505
no-op instead of being revived — a permanent dead end on 4 real, ownership-proven
capture surfaces. `reviveIfUnsubscribed` already exists and is wired into 2 of the 6
insert paths (`subscribeToAlerts`, `subscribeSignedInAlert`); wire it into the
remaining 4.

## Scope
- `src/app/actions.ts` only:
  - `subscribeToConfirmedAlert`
  - `subscribeManageCrossSell`
  - `createManageAlert`
  - `subscribeSavedSearchAlert` (hoist its existing `createAdminClient()` call earlier)
- No schema change, no new capture point, no UI change (all 4 already insert as
  `status: 'confirmed'` — same no-second-opt-in precedent `reviveIfUnsubscribed`'s
  `targetStatus: 'confirmed'` branch already serves).

## Acceptance criteria
- All 4 functions call `reviveIfUnsubscribed(admin, email, sourcePath || null, 'confirmed')`
  on a `23505` conflict, mirroring `subscribeSignedInAlert`'s existing pattern.
- A non-23505 error still returns the existing error message unchanged.
- A 23505 conflict on a row that is NOT `status: 'unsubscribed'` remains a true no-op
  (unchanged behavior) — `reviveIfUnsubscribed` already guards this internally.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/alerts/status`, `/alerts/manage`, `/searches` (the 3 pages whose
  actions changed) at desktop 1280 + mobile 375.
- Live-verified against the real prod DB with throwaway `@example.com` test rows: seed
  an `unsubscribed` alert, call the affected action, confirm the row flips to
  `confirmed`; delete all test rows/users after.

## Out of scope
- The 2 already-wired paths (`subscribeToAlerts`, `subscribeSignedInAlert`) — untouched.
- Stripping the `share=alert` marker in these 4 functions (a separate, already-shipped
  concern scoped to `subscribeToAlerts`/`AlertSignup` only).
- Any UI copy change — the revive is silent/transparent, matching the existing pattern.
