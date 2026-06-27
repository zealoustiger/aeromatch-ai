# Spec: cost-to-own-share-split

**Timestamp:** 2026-06-27T05:45:50Z
**Slug:** cost-to-own-share-split

## Goal
Extend the "Estimated cost to own" panel on `/aircraft/listing/[id]` to show what the
aircraft would cost as a **1/2, 1/3, or 1/4 partnership share** — a proprietary
ownership-cost comparison no competitor listing site offers. Turns a static price tag
into a real decision tool.

## Pillar
Pillar 3 — proprietary buyer analysis. Rotated here because last two cycles were
Pillar 1 (posting) and Pillar 2 (signup).

## Scope
- `src/lib/calculators.ts` — add `estimateShareCosts(askingPrice, engineReservePerYear?)` helper
- `src/app/aircraft/listing/[id]/page.tsx` — replace the current single-owner cost
  panel with a 4-row share-split table; incorporate engine reserve when available

## Acceptance criteria
1. The cost section shows a table with rows for Full ownership, 1/2 share, 1/3 share,
   and 1/4 share — each with a Monthly and Annual cost column.
2. Fixed costs (insurance ≈ 1% of price, hangar $7,500/yr, annual inspection $2,500/yr,
   and engine reserve when known) are divided equally by the number of partners; the
   operating cost (fuel/oil, ~100 hrs × $120/hr) stays the same for each partner.
3. When the Engine Life panel is also rendered (smoh + engine_type known), its
   `reservePerYear` is folded into the fixed-cost pool before splitting — so the
   numbers stay consistent across the two panels.
4. A "Find a co-owner on ClubHanger →" CTA links to `/partnerships` to cross-sell
   the partnership marketplace.
5. The panel still carries the existing "rule-of-thumb" caveat and link to
   `/tools/cost-calculator`.
6. Page renders clean at desktop 1280 + mobile 375 with no horizontal overflow.

## Out of scope
- Interactive client-side toggle (static server-rendered table is sufficient for v1)
- Actual listing-derived hourly costs (fuel burn by make/model) — keep $120/hr default
- Partnership buy-in / monthly dues calculator (that's the `/tools/cost-calculator`)
- Any schema change
