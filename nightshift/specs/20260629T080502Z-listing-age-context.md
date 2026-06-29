# Spec: listing-age-context

**Timestamp:** 20260629T080502Z  
**Slug:** listing-age-context  
**Pillar:** Pillar 3 — proprietary buyer analysis  
**BACKLOG item:** [P2][goal] Market position + days-on-market

## Goal
Complete the "Market position + days-on-market" BACKLOG item by surfacing listing age (absolute + relative) inside the sidebar EstimatePanel, so buyers see the full market context — price comparison AND listing-age context — in the one place they already look when evaluating price.

## Background
The aircraft listing detail page already computes:
- `listed` — "Listed 14 days ago" (from `first_seen_at`)
- `domContext` — relative comparison: "listed longer than ~65% of the 7 similar Cessna 172 listings still for sale" (from `computeDaysOnMarketContext` + already-fetched `familyComps`)

Both are used in the Deal Score tally in the MAIN COLUMN. Neither surfaces in the SIDEBAR where the price and ClubHanger Estimate live — the sidebar EstimatePanel shows comp count, range, and % delta but is silent about how long this listing has been sitting.

Adding listing age to the EstimatePanel gives the sidebar the complete market picture the BACKLOG item describes: "N comparable {make} {model} listed, median $X — this is P% below/above; listed N days ago."

## Scope — files to touch
- `src/app/aircraft/listing/[id]/page.tsx` only:
  - Add a `daysOnMarket: number | null` const (computed once from `first_seen_at`)
  - Pass `listed`, `daysOnMarket`, `domContext` to `EstimatePanel`
  - Update `EstimatePanel` props interface + render to show listing age in the footer section

## Acceptance criteria
1. The sidebar EstimatePanel, when a listing has `first_seen_at`, shows "Listed N days ago" in the footer area below the existing comp copy.
2. When `domContext` is available (comp set meets the honesty floor), the footer also shows the relative listing-age context: "listed longer than ~X% of the N similar {family} aircraft for sale now — seller may have flexibility" (when ≥ 30 days) OR "listed longer/shorter/typical" (when < 30 days or neutral), matching the language already used in the Deal Score tally.
3. Self-suppresses cleanly when `first_seen_at` is null or `domContext` is null — no fabricated copy.
4. No new DB queries — reuses `listed`, `domContext`, and `daysOnMarket` already computed from the existing data.
5. `npx next build` + `tsc --noEmit` pass with no new errors.
6. QA smoke on the aircraft listing detail page exits 0 at desktop 1280 + mobile 375 (HTTP 200, no console errors, no horizontal overflow).
7. Visual: the new section renders cleanly below the existing EstimatePanel content — no overlap, no layout shift, no overflow at 375px.

## Out of scope
- Partnership detail page (next Pillar 3 cycle)
- Seeker/aircraft browse pages
- Adding listing age to a standalone sidebar card (fold into EstimatePanel footer)
- Any new DB columns or queries
