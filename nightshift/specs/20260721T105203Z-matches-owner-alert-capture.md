# matches-owner-alert-capture

## Goal
Add owner-side alert capture to `/matches` so a signed-in owner viewing today's matches for
their partnership/seeking listings can also subscribe to hear about the *next* one — closing
the last open `[P1][goal]` alert entry-point gap (`/matches` currently has zero alert capture).

## Scope
- `src/app/matches/page.tsx` only.
- For each partnership-listing match section (owner has a partnership, sees matching seekers),
  add an `AlertSignup` mirroring the existing `owner_partnership_seeker` pattern already shipped
  on `/partnerships/[id]` (`noun="seeker"`, `sourcePath=/partnerships/seeking?make=...&state=...`),
  with `source="matches_page"`.
- For each seeker-listing match section (owner is seeking, sees matching partnerships), add an
  `AlertSignup` (`noun="partnership"`, reuse the already-imported `partnershipBrowseHrefForSeeker`
  helper for `sourcePath` per the backlog item's own suggestion), with `source="matches_page"`.
- No schema change, no new server action — reuses the existing `AlertSignup` component and
  `subscribeSignedInAlert`/`subscribeToAlerts` machinery it already wraps.

## Acceptance criteria
- Signed-in `/matches` with an active partnership listing that has ≥1 matching seeker shows an
  "alert me about the next seeker" capture box under that listing's rail.
- Signed-in `/matches` with an active seeking listing that has ≥1 matching partnership shows an
  "alert me about the next partnership" capture box under that listing's rail.
- Submitting either box creates a confirmed/pending row in `alerts` (verified live against the
  real DB with a throwaway `@example.com` account, then deleted) and fires `alert_subscribed`
  with `source: 'matches_page'`.
- `next build` + `tsc --noEmit` clean; `qa-smoke.mjs` on `/matches` passes at desktop 1280 +
  mobile 375 (HTTP 200 — via a real signed-in session or a documented equivalent check, 0
  console errors, 0 overflow).
- No layout regression to the existing rails/empty-state.

## Out of scope
- Listings with currently zero matches (no rail rendered today) — this slice only adds capture
  to the existing per-listing sections; a listing with 0 current matches getting no capture at
  all is a natural next slice, not fixed here.
- Any change to the matching algorithm, `/matches` empty-state copy, or other alert surfaces.
