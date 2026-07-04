# Listing-card annual/damage-history chip

## Goal
Surface the honesty-gated annual-inspection and damage-history reads (already live on
the aircraft-for-sale and partnership detail pages) as compact browse-card chips, closing
the one remaining Pillar-3 (proprietary buyer-analysis) parity gap — engine-life and
avionics/IFR both already got this same detail→card treatment, annual/damage never did.

## Scope
- `src/components/AircraftSaleCard.tsx` — add `AnnualStatusChip` + `DamageHistoryChip`,
  reusing `computeAnnualStatus` (`src/lib/annualStatus.ts`) and `computeDamageHistory`
  (`src/lib/damageHistory.ts`); render next to the existing engine/avionics chips.
- `src/components/PartnershipCard.tsx` — same two chips, same recipe (mirrors the
  existing `EngineTimeChip`/`IfrCardBadge` duplication pattern already used between
  these two card components).
- No schema change (both `aircraft_for_sale.annual_due`/`damage_history` are native
  columns already selected by `select('*')`; partnership columns already exist per the
  `partnership-annual-damage` migration — same dormancy caveat as the existing engine-life
  card chip until a human applies it, no regression either way).
- No new query — the fields are already present on every card's `p` prop.

## Design choice (chip-clutter / honesty)
Only render a chip for the *actionable* states, mirroring the existing `DealCheckChip`
convention of suppressing the "nothing to report" case ('fair' verdict) to avoid noise:
- Annual: suppress `'current'` (the common, unremarkable case); show `'soon'` → "Annual
  due soon" and `'overdue'` → "Annual overdue" (amber, cautionary — matches the existing
  "Priced high" amber convention).
- Damage: suppress `'clean'` (no damage reported — the common case); show `'reported'` →
  "Damage reported" (amber).
- Both chips self-suppress entirely when the underlying value is null/unparseable
  (inherited for free from `computeAnnualStatus`/`computeDamageHistory`'s existing
  honesty gates — no new gate to design).

## Acceptance criteria
- `AircraftSaleCard` shows an amber "Annual overdue"/"Annual due soon" chip when
  `p.annual_due` parses to those states; no chip when current/null.
- `AircraftSaleCard` shows an amber "Damage reported" chip when `p.damage_history === true`;
  no chip when false/null.
- `PartnershipCard` shows the same two chips under the same rules, using `p.annual_due`/
  `p.damage_history`.
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) passes on `/aircraft` and `/partnerships` — HTTP
  200, no console errors, no horizontal overflow.
- Visual cycle — screenshots reviewed to confirm chips render cleanly without breaking
  the card's badge-row wrapping at both viewports.

## Out of scope
- Seeker cards/list (seeker listings have no annual/damage columns — not applicable).
- Any change to the existing detail-page panels or honesty logic in
  `annualStatus.ts`/`damageHistory.ts`.
- Applying the pending `partnership_add_annual_damage`-family migration (human action,
  already flagged elsewhere in BACKLOG.md).
