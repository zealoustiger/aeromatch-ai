# Spec: deal-verdict-rail-cards

**Timestamp:** 20260627T125858Z  
**Pillar:** Buyer analysis (Pillar 3)  
**Slug:** deal-verdict-rail-cards

## Goal
Upgrade the "Similar aircraft for sale" rail on listing detail pages to show the same year+hours-controlled deal verdict ("Good deal" / "Priced high") that browse cards already show — replacing the current less-accurate whole-family estimate.

## Problem
The `SimilarAircraft` component already shows deal chips on rail cards (`compVerdict` prop on `AircraftRailCard`), but it computes them using `clubHangerEstimate` (whole-family median, no year/hours control). This means a 1970 Cessna 172 listed below the 172 family median (which includes 2020s) incorrectly shows "Good deal" — the gap is explained by age, not a bargain. Browse cards were upgraded to `clubHangerDealVerdict` (year+hours-controlled) in `deal-verdict-browse-chips`; the Similar aircraft rail was not.

## Scope
- `src/lib/aircraftForSale.ts` — add `getFamilyCompsForBatch`: returns comps with `id` + price + year + ttaf for a family, no excludeId filter, so callers can batch-compute verdicts for multiple listings and self-exclude in JS.
- `src/components/SimilarAircraft.tsx` — replace `getFamilyAskingPrices` + `clubHangerEstimate` with `getFamilyCompsForBatch` + `clubHangerDealVerdict`; self-exclude each listing from its own comp set by filtering `c.id !== p.id`.

## Acceptance criteria
1. The "Similar aircraft for sale" rail on `/aircraft/listing/[id]` shows "Good deal" (emerald) or "Priced high" (amber) chips ONLY when ≥4 similar-year (±5 yr) + similar-hours (±1k hrs or ±35%) comps warrant it.
2. Listings without `year` or `ttaf` show no chip (correct self-suppression — `clubHangerDealVerdict` returns null when subject lacks year or ttaf).
3. "Fair price" verdicts are suppressed (no chip) — same as browse cards.
4. No console errors, HTTP 200, no horizontal overflow at 375px.
5. No layout regression on the listing detail page.

## Out of scope
- Homepage `HomeRails` deal chips (separate cycle — more complex batch fetch across all rails).
- Changing the chip visual style.
- Any schema or DB changes.
