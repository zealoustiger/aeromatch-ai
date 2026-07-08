# seeker-similar-rail

## Goal
Add a "Similar pilots also seeking" rail to the pilot-seeking detail page
(`/partnerships/seeking/[id]`), closing the last gap of the backlog's
"'Similar planes' comparables on every listing" item — aircraft-for-sale and
partnership detail pages already have a same-make/region "similar" rail
(`SimilarAircraft`, `SimilarListings`); the seeker detail page has none.

## Scope
- New `src/components/SeekerRailCard.tsx` — compact rail card (mirrors
  `PartnershipRailCard`'s sizing/shape) showing avatar, anonymized name,
  aircraft-want summary, home airport, and budget. No photo (seekers have no
  photos — reuse `AviatorAvatar`).
- New `src/components/SimilarSeekers.tsx` — server component: fetch up to 30
  other `status='active'` `partnership_seekers` rows matching same preferred
  make OR same home_airport OR same state (mirrors `SimilarListings.tsx`'s
  `.or()` query shape), rank (same-make first, then same-state, then same-
  airport, then recency), take 12, render via the existing `RailScroller`.
  Fails soft (renders nothing) with 0 candidates. Mock-data fallback (`MOCK_SEEKERS`)
  when Supabase isn't configured, matching `SimilarListings`'s pattern.
- Wire `SimilarSeekers` into `src/app/partnerships/seeking/[id]/page.tsx`,
  placed after the "Partnerships near {airport}" cross-sell section.
- No schema change, no new dependency, no new query param.

## Acceptance criteria
- On a seeker detail page, when ≥1 other active seeker shares a preferred make,
  home airport, or state, a "Similar pilots also seeking" rail renders below
  the existing partnerships cross-sell section, each card linking to its own
  `/partnerships/seeking/[id]`.
- The current seeker never appears in its own rail.
- When no sensible match exists, the section renders nothing (no empty
  heading, no console error).
- `npx next build` + `tsc --noEmit` pass clean.
- `qa-smoke.mjs` passes (HTTP 200, zero app-console errors, zero horizontal
  overflow) at desktop 1280 + mobile 375 on `/partnerships/seeking` and a
  seeded seeker detail page.
- No change to `partnership_seekers` schema, RLS, or any FREEZE-listed file.

## Out of scope
- Cross-linking similar seekers into alert/match logic.
- Photo galleries or any new seeker field.
- Applying "similar" ranking improvements to the existing aircraft/partnership
  rails.
