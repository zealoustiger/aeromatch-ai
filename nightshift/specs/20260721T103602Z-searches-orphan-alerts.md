# searches-orphan-alerts

## Goal
Surface a signed-in user's confirmed/pending email alerts that have no matching
`saved_searches` row on `/searches`, so "saved-search ↔ alert" is actually unified
(GOAL.md), plus a one-tap "save as a search" for the alerts that can become one.

## Scope
- `src/app/searches/page.tsx` — fetch `fetchAlertsForEmail(user.email)`, diff
  against the saved searches' `${path}?${search_params}` set, render the
  unmatched ("orphan") alerts in a new "Your email alerts" section (context,
  status badge, Manage link into `/alerts/manage#alert-<id>`, and — only for
  alerts whose source_path base is `/aircraft`, `/partnerships`, or
  `/partnerships/seeking` — a "Save as a search" button).
- New `src/components/SaveAlertAsSearchButton.tsx` — client component wrapping
  the existing `saveSearch` action.
- No schema change. No new alert capture point (reuses the existing `alerts`
  table + `saveSearch`'s existing best-effort alert insert, which is idempotent
  via 23505).

## Acceptance criteria
- Signed-in visitor with a confirmed alert whose `source_path` doesn't match
  any saved search sees it listed under "Your email alerts" on `/searches`.
- An alert whose `source_path` DOES match an existing saved search does NOT
  appear twice (no duplicate row).
- "Save as a search" only renders for the 3 saveable marketplace base paths;
  clicking it creates a `saved_searches` row and the alert then moves into the
  normal saved-searches list above (via `revalidatePath('/searches')`).
- The section renders (or is correctly absent) whether or not the user has any
  saved searches yet (previously the whole page returned early for 0 saved
  searches, hiding alert-only subscribers entirely).
- `next build` + typecheck clean. `qa-smoke.mjs` on `/searches` (desktop 1280 +
  mobile 375): HTTP 200, 0 console errors, 0 overflow.
- No regression to the existing saved-searches list, quick-start form, or
  seeker cross-post nudge.

## Out of scope
- Editing/pausing/deleting the orphan alert inline (link to `/alerts/manage`
  instead — that page already owns those controls).
- "Build your own alert" builder on `/alerts` landing (separate backlog item).
- Owner-side alert capture on `/matches` (separate backlog item).
