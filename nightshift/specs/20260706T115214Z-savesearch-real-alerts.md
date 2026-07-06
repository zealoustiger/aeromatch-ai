# savesearch-real-alerts

## Goal
Wire `saveSearch()` (the "Save this search" button used on `/aircraft`, `/partnerships`,
`/partnerships/seeking`, and the `/searches` quick-start form) to actually create a
confirmed `alerts` row, so saved searches start delivering real new-listing emails via the
already-live `alert-digest` cron — closing the one missing link the site's own copy
already promises ("tap Save this search to turn on alerts").

## Scope
- `src/app/actions.ts` — `saveSearch()`: after a successful `saved_searches` insert, also
  insert a matching `alerts` row (`status: 'confirmed'`, `confirmed_at: now()`, since the
  user is already authenticated — skip the anonymous double-opt-in flow entirely).
  Insert-only, idempotent on the existing `unique(email, source_path)` constraint (a
  23505 conflict is a no-op success, matching `subscribeToAlerts`'s established pattern).
  Best-effort: a failure here must never fail the search-save itself.
- `src/app/account/page.tsx` — update the "Email alerts" section copy: remove the
  "Email delivery is rolling out soon" placeholder note now that saved searches really do
  wire to the live alert pipeline.

## Out of scope
- No backfill/repair of `saved_searches` rows created before this cycle (their alert
  subscription won't exist until re-saved) — flagged in the CHANGELOG as a known follow-up,
  not silently mutated.
- No change to `SaveSearchButton.tsx`'s confirmation UI copy (already accurate enough via
  the surrounding page copy) or to `QuickStartSearchForm.tsx` (its existing explicit
  `subscribeToAlerts` call becomes a harmless idempotent no-op once `saveSearch` does this
  internally — same source_path shape, so it hits the same unique-conflict path).
- No schema change — `alerts.status`/`confirmed_at` columns already exist and are live
  (confirmed directly against the DB).

## Acceptance criteria
- Calling `saveSearch()` as an authenticated user with a real email creates exactly one
  new `alerts` row with `status='confirmed'`, correct `context`/`source_path`.
- Calling it twice with the same search (same email + source_path) does not error and
  does not create a duplicate row.
- `next build` + typecheck clean.
- `/account`, `/searches`, `/aircraft`, `/partnerships`, `/partnerships/seeking` all render
  with zero new console errors, zero horizontal overflow, at desktop 1280 + mobile 375.
- `/account`'s copy no longer claims delivery is "rolling out soon."
