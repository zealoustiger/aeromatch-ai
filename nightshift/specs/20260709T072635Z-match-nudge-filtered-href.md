# Match-count nudge: filtered browse link (precision fix)

## Goal
Make the owner-only "N matches" nudge's "Browse them" link actually reflect the
count it just showed, by carrying the real compatibility criteria (`isCompatibleMatch`
+ `isWithinTravelRadius` in `src/lib/matching.ts`) into the destination browse page's
URL, instead of `make` alone.

## Context / the gap
`MatchCountNudge` appears on `/partnerships/[id]` and `/partnerships/seeking/[id]`
(owner view only), computed via `countMatchingSeekersForPartnership`/
`countMatchingPartnershipsForSeeker` (`src/lib/matchingQuery.ts`), which check make,
price ceilings, min_hours, ratings_required, share_type, AND travel-radius. But the
"Browse them" `href` on both pages only passes `make=`, so a nudge reading "3 matches"
can click through to a `/partnerships/seeking` or `/partnerships` browse page showing
dozens of unrelated results — the count and the link disagree, which undermines the
one thing this feature exists to build (trust in an honest match count).

## Scope
- New exported helpers in `src/lib/matchingQuery.ts`:
  - `seekerBrowseHrefForPartnership(p: Partnership): string` → builds a
    `/partnerships/seeking?...` URL carrying every dimension that page's filter
    (`src/lib/seekersQuery.ts`) can actually honor and that `isCompatibleMatch` checks:
    `make`, `airport` + `radius` (from `p.home_airport`, default 100mi proxy for the
    seeker's own stated radius, which varies per-seeker and can't be known from the
    partnership side), `min_hours` (from `p.min_hours`), `rating` (from
    `p.ratings_required`, OR-semantics approximation of the AND check), `share_type`.
  - `partnershipBrowseHrefForSeeker(s: PartnershipSeeker): string` → builds a
    `/partnerships?...` URL carrying what `partnershipsQuery.ts` supports: `make`
    (only when the seeker has exactly one preferred make — `/partnerships`' make
    filter has no multi-OR), `airport` + `radius` (from `s.home_airport` +
    `s.willing_to_travel_nm`, this direction IS exact — it's the seeker's own real
    radius), `max_buyin` (from `max_buy_in`), `max_monthly`, `share_type` (only when
    the seeker has exactly one preferred share type).
  - Both skip any dimension the destination page can't filter by at all (hourly rate
    ceiling, partnership's own `min_hours`/`ratings_required` on the `/partnerships`
    side, `model` on either side — `isCompatibleMatch` doesn't check model, so adding
    it would *under*-count vs. the shown number, the opposite bug).
- Wire these into the two `MatchCountNudge` call sites (`src/app/partnerships/[id]/page.tsx`
  ~line 731, `src/app/partnerships/seeking/[id]/page.tsx` ~line 445), replacing the
  inline `make`-only `URLSearchParams`/template-string hrefs.
- No schema change, no new dependency, no new component.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` clean.
- A partnership's "Browse them" link to `/partnerships/seeking` carries make +
  airport/radius + (min_hours/rating/share_type when the row has them), verified by
  reading the rendered `href` in served HTML for a real listing with at least one of
  min_hours/ratings_required set.
- A seeker's "Browse them" link to `/partnerships` carries airport/radius (exact) +
  max_buyin/max_monthly/make/share_type when applicable, verified the same way for a
  seeker row with a single preferred make + set budget ceilings.
- Neither href regresses to an empty/broken query string when the row has none of the
  optional fields set (falls back to bare `make=`/`/partnerships` as before).
- No visual change (the nudge box itself, copy, and count logic are untouched) — QA
  gate is smoke-only (HTTP 200 / no console errors / no overflow), not a screenshot read.

## Out of scope
- Making the seeking-page `rating`/model filters exactly AND-semantic (would need a
  browse-page filter change, not just a link fix).
- A standalone `/matches` view or match badges on browse cards (separate, bigger
  BACKLOG.md items under "Compatibility matching engine").
- Any change to the compatibility scoring itself (`matching.ts`) or the counts shown.
