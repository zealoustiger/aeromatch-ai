# seeker-saved-search-path-fix

## Goal
Fix a confirmed bug where saving a search from `/partnerships/seeking` silently mislabels
it as a `/partnerships` saved search, sending the user to the wrong marketplace and the
wrong query params when they later click "View".

## Background (confirmed via direct code read, not backlog text)
- `SeekerFilters.tsx` and `partnerships/seeking/page.tsx` both render
  `<SaveSearchButton basePath="/partnerships/seeking" />`.
- `saveSearch()` in `src/app/actions.ts` gates the incoming `path` through
  `SAVED_SEARCH_PATHS = ['/partnerships', '/aircraft'] as const` — anything not in that
  list (including `/partnerships/seeking`) silently falls back to `/partnerships`.
- Every other layer already expects `/partnerships/seeking` as a first-class saved-search
  path: `marketplaceLabel()` in both `/searches` and `/account` renders "Pilot Seekers"
  for it, `describeSearch()`/`describeSeekerSearch()` in `/searches` parses seeker-specific
  params (`rating`, `min_hours`, `share_type`), and `autoNameSearch()` in
  `src/lib/savedSearchName.ts` already branches on it (`nameSeeker(p)`). Only the write
  path in `saveSearch()` never got the third path added.
- Effect: a pilot who saves a search on `/partnerships/seeking` gets a row stored with
  `path='/partnerships'` and seeker-flavored `search_params` (e.g. `rating=cfi&min_hours=50`)
  — `/searches`/`/account` mislabel it "Partnerships", and its "View" link sends them to
  `/partnerships?rating=cfi&min_hours=50`, which is the wrong page entirely (partnership
  browse ignores those params).
- Checked the live `saved_searches` table (service-role key, read-only): only 3 rows exist
  today, none affected (no seeker-shaped params in a `/partnerships`-path row) — this is a
  live landmine, not yet a hit, but must be fixed before it corrupts real data.

## Scope
- `src/app/actions.ts`: add `/partnerships/seeking` to `SAVED_SEARCH_PATHS`.
- No other file changes expected — `/searches`, `/account`, `SaveSearchButton.tsx`, and
  `savedSearchName.ts` already handle this path correctly; this is purely the missing
  write-side whitelist entry.

## Acceptance criteria
- Saving a search from `/partnerships/seeking` persists `path='/partnerships/seeking'`
  (verified directly against the live DB with a throwaway row, deleted immediately after).
- Saving a search from `/aircraft` and `/partnerships` is unaffected (still saves with
  those exact paths).
- `npx next build` + `npx tsc --noEmit` clean.
- No UI/visual change — this is a pure server-action logic fix, so the QA gate is the
  smoke test only (no screenshot read required).

## Out of scope
- Backfilling/repairing any already-corrupted historical row (none exist today per the
  live-DB check above).
- Wiring `saved_searches` to the `alerts` table so saved searches actually send email
  (a separate, larger `[want]` item — "Saved listings + instant new-match email alerts,"
  BACKLOG.md — noted as the next slice below).
