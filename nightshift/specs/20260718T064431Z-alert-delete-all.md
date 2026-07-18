# Spec: "Delete all my alerts & data" self-serve on /alerts/manage

## Goal
Let a subscriber on `/alerts/manage` permanently delete every alert row tied to
their email in one typed-confirmation-gated action, instead of deleting rows
one by one and taking our word the rest are gone.

## Scope
- `src/app/actions.ts` — new `deleteAllAlerts(token?: string)` server action,
  mirroring the existing `pauseAllAlerts`/`resumeAllAlerts` bulk pattern
  (owner proven via `resolveOwnerEmail`, scoped by `.eq('email', ownerEmail)`,
  no row-id needed).
- `src/components/DeleteAllAlertsControl.tsx` — new client component: a
  collapsed "Delete all my alerts & data" affordance at the bottom of the
  alerts panel. Expanding it reveals a warning, a "type DELETE to confirm"
  text input, and a red confirm button (disabled until the typed text matches).
  On success, replaces itself with a plain confirmation of what was removed.
- `src/app/alerts/manage/page.tsx` — mount `DeleteAllAlertsControl` at the
  bottom of the `ch-panel` section, passing `token`/`email`/`alerts.length`.

## Acceptance criteria
- The control only renders when there is at least one alert row for the
  resolved email (nothing to delete otherwise).
- It works for both the signed-in path and the token-scoped (no-account)
  path, using the same `resolveOwnerEmail(admin, token)` ownership proof
  every other bulk alert action already uses — no new trust boundary.
- The confirm button stays disabled until the visitor types the exact
  word `DELETE` into the confirmation field (typed-confirmation gate, not
  just a `window.confirm` dialog).
- On confirm, every `alerts` row for that email is hard-deleted
  (`.delete().eq('email', ownerEmail)`), the page's alert list re-renders
  empty via the existing `revalidatePath('/alerts/manage')` convention, and
  a plain "Deleted N alerts for `<email>`. Nothing else is stored for this
  address." message shows in place of the control.
- No schema change; no change to any other action's behavior; the
  per-row `deleteAlert` action and `AlertActions` component are untouched.
- Build + typecheck stay green; QA smoke passes on `/alerts/manage`.

## Out of scope
- Deleting the visitor's Supabase account (signed-in users keep their
  account/listings/saved-searches — only the `alerts` table rows for that
  email are removed, matching `pauseAllAlerts`'s existing scope).
- Any change to the single-row delete flow or `AlertActions.tsx`.
- A confirmation email for the bulk delete (not requested by the backlog item).
