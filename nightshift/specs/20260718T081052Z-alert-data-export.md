# alert-data-export

## Goal
Let a subscriber download every alert row we hold for their email as a JSON file from
`/alerts/manage`, the natural read-only sibling of the already-shipped "delete all my
alerts & data" affordance.

## Scope
- `src/lib/alertOwner.ts` (new) — extract the existing `resolveOwnerEmail` ownership-proof
  helper out of `src/app/actions.ts` so both the server actions and the new export route
  can share it.
- `src/app/actions.ts` — import `resolveOwnerEmail` from the new module instead of
  defining it locally; no behavior change to any existing action.
- `src/lib/alertsForOwner.ts` — add `fetchAllAlertsForEmail`, a new export-scoped read
  that reuses the same fail-soft optional-column pattern as `fetchAlertsForEmail`, but
  (a) includes `unsubscribed` rows (a full "what we hold" export must be complete) and
  (b) never selects `confirm_token`/`unsubscribe_token`/`email_change_token` (those are
  bearer secrets for unauthenticated action links, not "data about the user" — must
  never appear in a downloadable file).
- New route `src/app/api/alerts/export/route.ts` — `GET`, resolves the owner via
  `resolveOwnerEmail` (token query param or signed-in session, same trust boundary as
  every bulk alert action), reads via `fetchAllAlertsForEmail`, returns the rows as a
  `Content-Disposition: attachment` JSON file. 401 JSON error body if ownership can't be
  resolved.
- `src/components/DownloadAlertDataLink.tsx` (new, client) — a small link/button next to
  `DeleteAllAlertsControl` on `/alerts/manage` that points at the export route with the
  current token (or no token when signed-in), matching that component's collapsed/quiet
  visual style.
- `src/app/alerts/manage/page.tsx` — render the new link.

## Acceptance criteria
- Visiting `/alerts/manage` (signed in, or via a valid `?token=`) shows a "Download my
  alert data" link/button near the existing delete-all control.
- Clicking it (or hitting the route directly with a valid token/session) downloads a
  `.json` file containing every alert row tied to that email — including paused/
  unsubscribed rows — with real values (no fabricated fields), and does NOT include any
  of the three bearer-secret columns (`confirm_token`, `unsubscribe_token`,
  `email_change_token`).
- Hitting the route with no token and no session returns a 401 JSON error, not a file
  and not a 500.
- Hitting the route with a garbage/expired token returns the same 401 "no longer valid"
  shape as the other token-scoped actions.
- No new database writes; read-only feature, no schema change.
- `next build` + `tsc --noEmit` stay green; `qa-smoke` passes on `/alerts/manage` with
  zero new console errors and zero horizontal overflow at 1280 + 375.

## Out of scope
- CSV/other export formats — JSON only this cycle.
- Exporting anything beyond the `alerts` table (no cross-table data).
- Rate-limiting the export route (mirrors the existing unauthenticated-but-token-gated
  action routes, which also have no separate rate limit beyond token unguessability).
