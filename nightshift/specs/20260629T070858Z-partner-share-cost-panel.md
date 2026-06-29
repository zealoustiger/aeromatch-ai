# Spec: partner-share-cost-panel

**UTC:** 2026-06-29T070858Z  
**Pillar:** Buyer analysis (Pillar 3)  
**Slug:** `partner-share-cost-panel`

## Goal
Replace the generic "Cost estimator" compact widget on partnership detail pages with a purpose-built "Flying cost" panel that shows the annual total, per-flight-hour, and buy-in payback vs. renting — at selectable flying-hour rates (50/75/100/150 hrs/yr).

This answers the two questions every partnership buyer has that no other listing site addresses:
1. "What will it really cost me annually to fly this partnership?"
2. "Does this buy-in pay for itself vs. just renting?"

## Scope

Files expected to touch:
- `src/components/PartnerShareCostPanel.tsx` — NEW component (replaces CostCalculator compact)
- `src/app/partnerships/[id]/page.tsx` — swap import/usage
- `nightshift/BACKLOG.md` — mark Cost-to-own ✅ (aircraft detail already has ShareCostPanel)

## Acceptance criteria

1. Partnership detail sidebar shows a "Flying cost" panel with tabs: 50 / 75 / 100 / 150 hrs/yr.
2. At each tab, displays: annual total, monthly breakdown, and per-flight-hour — computed from the listing's `monthly_fixed` and `hourly_wet` (already per-partner values).
3. When annual savings vs. renting > 0: shows "Buy-in recouped in ~X yrs at these savings" (buy_in / annual_savings; reference rental rate = $150/hr labeled as "vs. typical club rental").
4. Component self-suppresses (returns null) when both `monthly_fixed` and `hourly_wet` are null/zero — no empty card.
5. No app-origin console errors; no horizontal overflow at 375px or 1280px; smoke gate exits 0.
6. The existing CostCalculator compact is no longer rendered on the partnership detail page (replaced by the new panel); the full CostCalculator at `/tools/cost-calculator` is unaffected.

## Out of scope

- Changes to the partnership `CostCalculator` full variant or the `/tools/cost-calculator` page
- Interactive editing of the wet rate (the listing's wet rate is the fact — use it directly)
- Engine-reserve folding (partnership page doesn't have a per-partner reserve figure yet)
- Any schema, DB, or server-action changes
