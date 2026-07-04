# Partnership Deal Check — browse-card + rail-card parity

## Goal
Bring the year/hours-narrowed `partnershipDealVerdict()` ("Good deal"/"Priced high") onto
the partnership browse card and rail card, mirroring the aircraft-for-sale side, which
already prefers the narrowed Deal Check verdict over the plain whole-family comp pill.

## Why this slice (Pillar 3 — buyer analysis, rotation due)
Last 2 landed cycles were Pillar 1 (`edit-contact-lazy-save-parity`) then Pillar 2
(`saved-empty-state-seeker-mention`), so Pillar 3 is due. `partnershipDealVerdict()`
shipped via `partnership-deal-check` (2026-07-04) but only renders on the partnership
*detail* page's `PartnershipMarketCheck` panel — explicitly flagged as the "next natural
Pillar 3 rail/card-parity slice" in that cycle's CHANGELOG `Next:` line. Aircraft-for-sale
already has this exact parity: `getAircraftCompVerdicts` / `AircraftSaleCard` prefer
`clubHangerDealVerdict` over the plain `compVsMarket` pill, and `SimilarAircraft` /
`AircraftRailCard` show ONLY the narrowed verdict ("Good deal"/"Priced high"). Partnerships
only ever show the plain whole-family comp on both surfaces today — a buyer scanning
`/partnerships` or a "Similar partnerships" rail gets a less honest read than one on the
aircraft side.

## Scope
- `src/lib/partnershipComps.ts`: extend `getPartnershipCompVerdicts` to also select
  `year`/`ttaf`/`smoh` and compute `partnershipDealVerdict` per listing (same family-scoped
  comp set already batched per unique make), preferring it over the plain
  `partnershipBuyInComp` pill — mirrors `getAircraftCompVerdicts`'s precedence exactly.
  New return shape: `Map<string, { comp: PartnershipCompVerdict | null; dealVerdict:
  PartnershipDealCheck | null }>` (new `PartnershipCardVerdict` type).
- `src/components/PartnershipCard.tsx`: split the single `compVerdict` prop into `comp` +
  `dealVerdict` (matching `AircraftSaleCard`'s prop shape exactly); add a
  `DealCheckChip`-equivalent ("Good deal" emerald / "Priced high" amber, "fair" suppressed)
  that wins over the existing below/above pct/median/count pill when present.
- `src/components/PartnershipList.tsx`, `src/app/saved/page.tsx`,
  `src/app/partnerships/near/[icao]/page.tsx`: thread the two props through instead of the
  old single `compVerdict`.
- `src/components/SimilarListings.tsx`: replace the inline whole-family-only comp logic
  with the narrowed-only `partnershipDealVerdict` computation, mirroring
  `SimilarAircraft.tsx` exactly (batch-fetch id+buy_in_price+total_shares+year+ttaf+smoh per
  unique make, exclude self, map `good`→`'below'`/`high`→`'above'`, suppress `'fair'`).
- `src/components/PartnershipRailCard.tsx`: relabel the existing `compVerdict` chip copy
  from "Below market"/"Above market" to "Good deal"/"Priced high" (matches
  `AircraftRailCard`'s copy) since the value now always comes from the narrowed verdict.

## Out of scope
- No schema change (uses the existing `ttaf`/`smoh`/`year` columns already on
  `Partnership`, same ones `partnership-deal-check` already reads on the detail page).
- No change to `partnershipDealVerdict`/`partnershipBuyInComp` themselves (pure functions,
  already shipped and unchanged).
- `getSeekerBudgetCheckVerdicts`/seeker budget check — unrelated, not touched.
- `MarketplaceCrossSell.tsx`'s `PartnershipRailCard` usage — already renders without a
  comp verdict today (matches `AircraftRailCard`'s usage in the same component); not adding
  a fetch there.

## Acceptance criteria
- `npx next build` + typecheck pass clean.
- `getPartnershipCompVerdicts` returns dealVerdict-first, comp-fallback verdicts; the 3
  callers compile against the new shape.
- `PartnershipCard`/`PartnershipRailCard` render identically to today when no verdict is
  present (self-suppression preserved — no fabricated states).
- Because no seed partnership currently clears `MIN_PARTNER_DEAL_COMPS` (4) inside both the
  year and hours bands, the new chip is expected to be dormant on real data — verify the
  chip renders correctly (no overlap, correct copy/color) via a temporary mock-data
  Playwright pass (reverted before commit, confirmed via `git status`), same technique used
  in `rail-card-annual-damage-chip`.
- QA smoke passes (HTTP 200 / no console errors / no horizontal overflow) on `/partnerships`,
  a real `/partnerships/[id]`, and `/saved` at desktop 1280 + mobile 375.
