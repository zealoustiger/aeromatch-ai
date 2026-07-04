# rail-card-annual-damage-chip

## Goal
Show the same honest "Annual overdue"/"Annual due soon"/"Damage reported" trust
signal on rail cards (Similar Aircraft / Similar Partnerships / cross-sell rails)
that the primary browse cards (`AircraftSaleCard`, `PartnershipCard`) already show.

## Scope
- `src/components/AircraftRailCard.tsx` — add a top-right overlay chip that mirrors
  `AnnualStatusChip`/`DamageHistoryChip` from `AircraftSaleCard.tsx`, reusing
  `computeAnnualStatus` (`src/lib/annualStatus.ts`) and `computeDamageHistory`
  (`src/lib/damageHistory.ts`). Priority when both are actionable: damage reported
  wins (more consequential to a buyer), else annual-overdue, else annual-due-soon.
  Self-suppresses entirely on the common clean/current state (matches existing
  card convention — no clutter for the routine case).
- `src/components/PartnershipRailCard.tsx` — identical chip, same priority logic.
- No schema change. `annual_due`/`damage_history` are already on `AircraftForSale`
  and `Partnership` types and already passed into these components via `p`.

## Layout
Rail card overlay corners already in use: top-left (comp verdict/discount pct),
bottom-left (placeholder badge or engine chip, mutually exclusive), bottom-right
(avionics chip). Top-right is free — new chip goes there.

## Acceptance criteria
- `AircraftRailCard` shows an amber "Annual overdue" / "Annual due soon" / "Damage
  reported" chip at top-right when `p.annual_due`/`p.damage_history` indicate an
  actionable state; shows nothing when both are clean/current/absent.
- `PartnershipRailCard` shows the identical chip under the identical rules.
- No new DB query, no new column, no schema change.
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) on a
  page rendering each rail (`/aircraft` for AircraftRailCard-bearing rails,
  `/partnerships/[id]` for the Similar Partnerships rail) at desktop 1280 + mobile 375.
- Existing top-left/bottom-left/bottom-right chips unaffected (no overlap/collision).

## Out of scope
- SeekerCard (seeker listings have no aircraft yet, so no `annual_due`/`damage_history`).
- Detail-page panels or primary browse cards (already shipped).
- Any new analysis signal beyond annual/damage parity.
