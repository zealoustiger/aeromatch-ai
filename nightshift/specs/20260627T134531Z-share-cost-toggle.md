# Spec: share-cost-toggle

**UTC**: 2026-06-27T134531Z  
**Pillar**: Buyer analysis (Pillar 3)  
**Slug**: share-cost-toggle

## Goal
Make the static "Cost to own" table on the aircraft listing detail page interactive — let buyers click a share type (Sole / 1/2 / 1/3 / 1/4) to highlight their scenario, so they see their own number prominently instead of having to read all four rows at once.

## Scope
- New `src/components/ShareCostPanel.tsx` (Client Component, extracted from inline function in page.tsx)
- Update `src/app/aircraft/listing/[id]/page.tsx`: remove inline `ShareCostPanel`, import new component; remove unused `Wallet` import

## Acceptance criteria
1. The Cost to own panel shows four toggle pill buttons at the top: "Sole owner", "1/2 share", "1/3 share", "1/4 share"
2. Clicking a button highlights that scenario with a featured callout (big monthly + annual figures) above the comparison table
3. The selected row in the table is visually highlighted (sky-50 background, bold text)
4. Table rows are clickable (also toggle the selection)
5. Panel self-suppresses when no price is available (unchanged — `shareCosts` is null → not rendered)
6. "Run your own numbers" and "Find a co-owner on ClubHanger" links remain
7. `npx next build` exits 0 (no TypeScript errors)
8. QA smoke exits 0 on `/aircraft/listing/[id]` at desktop 1280 + mobile 375

## Out of scope
- Changing the cost model itself (insurance %, hangar rate, hours/yr)
- Custom input fields for hours or costs (those belong in /tools/cost-calculator)
- Touching any other page or component
