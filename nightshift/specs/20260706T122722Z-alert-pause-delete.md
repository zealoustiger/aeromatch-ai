# Pause & delete an alert

## Goal
Let a signed-in pilot pause (and resume) or permanently delete an alert subscription from `/alerts/manage`, and fix that page's read query so it actually shows real rows today instead of waiting on an unapplied RLS migration.

## Scope
- `src/app/actions.ts`: new owner-scoped `pauseAlert`/`resumeAlert`/`deleteAlert` actions. Ownership is proven by matching the signed-in user's email against the alert row (fetched via the service-role client), the same pattern used elsewhere for PII-holding tables the anon/authenticated role can't SELECT.
- `src/app/alerts/manage/page.tsx`: switch the read from the anon/authenticated client (blocked by the still-unapplied `alerts_owner_select` RLS policy — currently always renders empty for real users) to the service-role client scoped to the signed-in user's own email. Add a "Paused" status chip.
- New `src/components/AlertActions.tsx`: client component rendering Pause/Resume + Delete buttons per row.
- No schema change. `alerts.status` is free-text (not an enum), so a new `'paused'` value needs no migration. The live `alert-digest` cron (`src/app/api/cron/alert-digest/route.ts`) already filters `status = 'confirmed'`, so a paused alert is automatically skipped with zero cron changes.

## Acceptance criteria
- A signed-in user's `/alerts/manage` page shows their real alert rows (previously always empty due to the pending RLS migration).
- An active ("confirmed") alert shows a Pause button; clicking it flips status to `paused` and the row re-renders as "Paused" with a Resume button.
- A paused alert's Resume button flips it back to `confirmed`/"Active".
- Every alert row has a Delete button (confirm dialog) that removes the row entirely.
- A user cannot pause/resume/delete another user's alert (email-ownership check server-side, not just RLS).
- No console errors, no horizontal overflow at 1280/375, `next build` + typecheck clean.

## Out of scope
- Changing the `alerts_owner_select` RLS policy (still pending human application — this slice deliberately avoids depending on it for reads or writes).
- The legacy, unwired `scraper/send-alerts.mjs` script (not on any cron; the live cron is `/api/cron/alert-digest`).
- Bulk/admin alert management.
