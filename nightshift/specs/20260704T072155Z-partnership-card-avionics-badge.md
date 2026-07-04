# partnership-card-avionics-badge

## Goal
Show an avionics capability badge (Glass panel / ADS-B Out / Autopilot / WAAS GPS) on the
main partnership browse card (`PartnershipCard.tsx`), closing a real parity gap: the aircraft
browse card, the partnership cross-sell rail card, and the partnership detail page all already
derive and display this signal — only the primary partnership list/browse card is missing it.

## Scope
- `src/components/PartnershipCard.tsx` — classify avionics from `p.description` (same
  phrase-split + `classifyAvionics()` recipe already used in
  `src/app/partnerships/[id]/page.tsx` and `src/components/PartnershipRailCard.tsx`), and
  render up to 2 capability chips in the badge row, mirroring `AircraftSaleCard.tsx`'s
  `AvionicsChip` treatment (same color map, same chip component shape).
- No DB/schema change — this is a pure client-side derivation from the existing
  `description` text column, identical to the pattern already proven on the detail page and
  rail card.
- Out of scope: IFR-suitability synthesized badge (`computeIfrSuitability`) — the aircraft
  card only shows that in place of raw chips for "full"/"capable" tiers; keep this slice to
  the raw capability chips for now to match the rail card's simpler treatment. Out of scope:
  `PartnershipCard`'s callers (list pages) — no changes needed there, prop shape is unchanged.

## Acceptance criteria
- A partnership whose `description` contains avionics keywords (e.g. "G1000", "ADS-B",
  "autopilot") shows the matching capability chip(s) in the card's badge row on `/partnerships`,
  `/saved`, `/airports/[icao]`, `/members/[id]`, `/partnerships/near/[icao]`.
- A partnership with no matching keywords in its description renders no avionics chip (self-
  suppresses) — no empty/fake chip.
- Chip visual style matches the existing color map (violet/glass, sky/adsb+waas,
  emerald/autopilot, slate/gps) used on `AircraftSaleCard` and `PartnershipRailCard`.
- `npx next build` + typecheck pass.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 +
  mobile 375 on `/partnerships`.
- No regression to the card's existing badges (share type, New, registration, TrustBadge,
  comp verdict, compare toggle).

## Out of scope
- Adding a structured `avionics` column to the `partnerships` table (description-text
  classification is sufficient, same as the rail card/detail page).
- IFR-suitability synthesized headline badge.
- Any change to the seeker or aircraft cards (already shipped).
