# Spec: match-count badges on My Listings

## Goal
Surface an owner-only "N matches" badge on each active partnership/seeking card in
`/listings` (the signed-in user's own listings management page), linking straight to
the filtered browse page of the compatible other side — the next real slice of the
long-running "Compatibility matching engine" backlog item (BACKLOG.md ~line 1549),
whose remaining scope explicitly lists "match badges" alongside the already-shipped
count nudge (on detail pages) and the not-yet-built standalone `/matches` view.

## Scope
- `src/app/listings/page.tsx` — for each active (`status` in `active`/`pending`)
  partnership and seeker row the signed-in user owns, compute the same match count
  already used on the detail-page nudge (`countMatchingSeekersForPartnership` /
  `countMatchingPartnershipsForSeeker`, both in `src/lib/matchingQuery.ts`) and, if
  > 0, render a small pill badge with the count linking to the same filtered browse
  href (`seekerBrowseHrefForPartnership` / `partnershipBrowseHrefForSeeker`).
- New small presentational component (or inline JSX) for the compact pill — distinct
  from the existing full-panel `MatchCountNudge` (designed for a detail-page hero
  slot, not a dense list row).
- No change to aircraft-for-sale cards (matching only applies partnership ↔ seeker).
- No change to past/closed listings section.

## Out of scope
- The standalone `/matches` view (separate, bigger slice).
- New-match email alerts.
- Any schema change — reuses 100% existing query/scoring functions, no new columns.
- Aircraft-for-sale listings (not part of the matching engine).

## Acceptance criteria
- A signed-in user with an active partnership listing that has ≥1 compatible active
  seeker sees a "N matches" pill on that listing's row in `/listings`, linking to the
  correct filtered `/partnerships/seeking?...` URL (same href builder used elsewhere).
- Same for an active seeking listing with ≥1 compatible partnership → pill links to
  the correct filtered `/partnerships?...` URL.
- A listing with 0 matches shows no pill (self-suppress, matches existing convention).
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke (`qa-smoke.mjs`) passes at desktop 1280 + mobile 375 on `/listings` with no
  new console errors and no horizontal overflow.
