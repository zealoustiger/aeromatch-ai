# listings-completeness-nudge

## Goal
Surface each active listing's trust/completeness score directly on the owner's `/listings`
dashboard, so a poster can see at a glance which of their listings need more detail without
clicking into every single one — closing the "poster completion nudges" gap in the
`[P1][want]` Listing trust layer (slice 3; slice 1 — trust badges — already shipped).

## Scope
- `src/app/listings/page.tsx` only:
  - Extend the 3 **active/pending** listing queries' `.select()` to include the columns
    each existing `evaluate*Trust` function reads (no schema change — all columns already
    exist): aircraft adds `description, registration, ttaf, smoh`; partnerships adds
    `images, image_is_placeholder, registration, monthly_fixed, hourly_wet, description,
    source_url, poster_id`; seekers adds `preferred_models, aircraft_category, max_buy_in,
    max_monthly, max_hourly, total_hours, ratings_held, poster_id`.
  - Render the existing `AircraftTrustBadge`/`TrustBadge`/`SeekerTrustBadge` (`variant="compact"`)
    — already used elsewhere for the identical "N/4 trust signals" chip — inline on each
    **active/pending** row, next to the `StatusBadge`. Reuses the components/logic as-is;
    no new trust-scoring code.
  - Past (sold/closed) listings section is untouched — no nudge value for a listing no
    longer live.
- No schema change, no new component, no ranking change (that's a separate, later slice).

## Acceptance criteria
- `/listings` compiles and renders for a signed-in user with active listings of all 3 types.
- Each active aircraft/partnership/seeker row shows its real "N/4 trust signals" chip
  (same visual chip already used on cards/detail pages), computed from the row's actual data
  — not a placeholder or fake number.
- A fully-complete listing shows "4/4" (or the type's real max); an incomplete one shows an
  accurate lower count matching what's actually missing.
- Past/sold listings section renders unchanged (no chip added there).
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) on `/listings`
  passes: HTTP-reachable-when-authed (redirect-to-auth when logged out is existing, unchanged
  behavior), no new console errors, no horizontal overflow.

## Out of scope
- Ranking listings by completeness (slice 2).
- A dedicated "improve your listing" prompt beyond the compact chip (the detail-page
  `*ListingOwnerNudge` components already do that full checklist+CTA treatment).
- Reducing off-platform redirects (slice 4).
