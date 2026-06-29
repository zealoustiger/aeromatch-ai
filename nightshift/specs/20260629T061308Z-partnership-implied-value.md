# Spec: partnership-implied-value

**Timestamp:** 20260629T061308Z  
**Pillar:** Pillar 3 — Proprietary buyer analysis  
**Slug:** `partnership-implied-value`

## Goal
Add a cross-market "Implied aircraft value" signal to the "How this partnership stacks up" panel: compute `buy_in_price × total_shares` and compare it to the median asking price of same make/model aircraft currently for sale on ClubHanger. Gives partnership shoppers a proprietary sanity check no listing site offers — "This 1/4 share at $40k implies a $160k aircraft, vs $145k median for Cessna 172s on the market."

## Friction removed / value added
Today's partnership panel compares buy-in only against *other partnerships* (same-make buy-in comps). It doesn't cross the silo into the for-sale market. A buyer can't easily tell whether the implied full-aircraft valuation is consistent with what aircraft of that type actually sell for. This signal fills that gap using data we already have.

## Scope (files to touch)
- `src/lib/partnershipImpliedValue.ts` — new pure helper `computeImpliedValueCheck`
- `src/lib/partnershipImpliedValue.test.ts` — unit tests
- `src/components/PartnershipDealSignals.tsx` — add `impliedValue` prop + new signal row
- `src/app/partnerships/[id]/page.tsx` — fetch for-sale prices, compute check, pass to component

## Acceptance criteria
1. On a partnership listing with known `buy_in_price`, `total_shares`, and a make/model that resolves via `resolveMakeModelFamily`, a new signal row appears in the "How this stacks up" panel showing the implied aircraft value vs. for-sale family median.
2. Signal is "positive" (implied below market), "neutral" (near market ±10%), or a "ask about" neutral (implied above market, framed as "ask what's included") — all with $ amount, % distance, and comp count.
3. Panel self-suppresses the row when: `buy_in_price` or `total_shares` is null; `total_shares < 2`; fewer than 4 for-sale comps; make/model doesn't resolve a family; or `getFamilyAskingPrices` returns nothing.
4. Existing signal rows (buy-in vs. partnership comps, days listed, cost transparency) are unchanged.
5. `npx next build` + `tsc --noEmit` pass clean.
6. `node nightshift/bin/qa-smoke.mjs --slug partnership-implied-value /partnerships/[id]` exits 0.
7. Unit tests pass.

## Out of scope
- Changing any DB schema or adding columns
- Touching the aircraft for-sale detail page
- Adding the signal to browse cards
- Removing or reordering existing partnership signals
