# Rail-card "Rare find" chip parity

## Goal
Bring the honesty-gated "Rare find — only N like this" scarcity signal (already live on
`AircraftSaleCard`) to the compact `AircraftRailCard` used on the homepage curated rails
and the listing-detail "Similar aircraft for sale" rail — the one named remaining gap on
the `listing-save-social-proof`/`aircraft-rare-find-chip` backlog item.

## Scope
- `src/components/AircraftRailCard.tsx` — add a `familyCount?: number | null` prop, export
  the existing `RARE_FIND_MAX` threshold from `AircraftSaleCard.tsx` and reuse it, render a
  compact indigo "Rare find" overlay chip in the photo's top-left slot.
- `src/components/AircraftSaleCard.tsx` — export `RARE_FIND_MAX` (currently module-private).
- `src/components/HomeRails.tsx` — compute a per-listing `familyCount` (the family comp
  array's length, already fetched in this file) and pass it down.
- `src/components/SimilarAircraft.tsx` — same, mirrors HomeRails' existing pattern.
- `src/components/DealsRail.tsx` — deliberately NOT touched: every listing there already
  cleared ≥4 comps to qualify as a "deal" (`getFamilyCompsForBatch`), so `familyCount` can
  never fall in the 1-3 "rare" range there — wiring it would be inert, matching the
  `/aircraft/deals` precedent already noted in BACKLOG.md.

## Why the top-left slot is safe to reuse (not a new layout)
`AircraftRailCard`'s top-left photo overlay already shows `discountPct` or `compVerdict`
(below/above market). Both of those require ≥`MIN_OTHER_COMPS` (4) *other* priced comps in
the family (`compVsMarket`/`clubHangerDealVerdict` return `null` below that). A "rare"
family has ≤3 total listings *including the subject itself* — i.e. ≤2 others — so it can
never simultaneously produce a deal verdict. The two states are mutually exclusive by
construction; no new badge slot or layout change needed.

## Acceptance criteria
- A rail card whose real, resolved make+model family has 1-3 active priced listings
  (including itself) shows a compact "Rare find" chip in the top-left photo overlay, with
  the full honest count in the `title` tooltip (matches the full card's copy/tone).
- A rail card with a resolvable deal verdict/discount still shows that pill (unaffected,
  since the two are mutually exclusive per above) — no regression to existing homepage
  rails, similar-aircraft rail, or deals rail.
- No chip when `familyCount` is `null`/unresolved or > 3 (never fabricated).
- `DealsRail.tsx` is unchanged — its cards keep showing only the discount pill.
- `npx tsc --noEmit` and `npx next build` pass clean.
- No new console errors, no horizontal overflow at desktop 1280 / mobile 375 on `/` and an
  aircraft listing detail page with a "Similar aircraft" rail.

## Out of scope
- `DealsRail.tsx` wiring (inert, see above).
- Any change to the full `AircraftSaleCard`'s existing `RareFindChip` (already shipped).
- DB/schema changes (none needed — pure read of already-fetched data).
