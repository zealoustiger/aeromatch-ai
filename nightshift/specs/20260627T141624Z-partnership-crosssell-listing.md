# Spec: partnership-crosssell-listing

**UTC:** 20260627T141624Z  
**Pillar:** Buyer analysis (Pillar 3)  
**Friction removed:** Buyers viewing a for-sale aircraft don't know co-ownership options exist for the same make — they leave to go price-shop full ownership when a $28k buy-in share might fit their budget.

## Goal
On aircraft listing detail pages, show a "Co-ownership available" sidebar panel when active ClubHanger partnerships exist for the same aircraft make — surfacing an affordable alternative ownership path that no other listing site offers.

## Scope
- `src/lib/partnershipsQuery.ts` — new `getPartnershipCrossSell(make)` helper returning `{count, minBuyIn}` or null
- `src/app/aircraft/listing/[id]/page.tsx` — call helper, add inline `PartnershipCrossSellPanel` component, render in sidebar

No schema changes. No new components file. No changes to existing panels.

## Acceptance criteria
1. On a listing with a known `make`, if ≥1 active partnership has that make (ILIKE match), a "Co-ownership available" panel appears in the sidebar (between EstimatePanel and ListingCompletenessPanel).
2. Panel shows: count of available co-ownership shares, minimum buy-in price when any listing has one (formatted as currency), and a CTA "Browse N [Make] partnerships →" linking to `/partnerships?make=<encoded-make>`.
3. Panel self-suppresses when `p.make` is null/blank or `getPartnershipCrossSell` returns null (zero matches).
4. Panel renders correctly at 375px (no overflow, legible).
5. `npx next build` exits 0 with zero TypeScript errors.
6. QA smoke exit 0 on `/aircraft/listing/[id]` at desktop 1280 + mobile 375.

## Out of scope
- Geo-proximity filtering (airport-radius matching) — the make filter alone is sufficient for the first slice
- Model-level matching (e.g. "Cessna 172 only") — make-level is broader and more likely to surface results
- Showing actual partnership cards (just a count + min buy-in + link is enough)
- Any change to the partnerships page or its filters
