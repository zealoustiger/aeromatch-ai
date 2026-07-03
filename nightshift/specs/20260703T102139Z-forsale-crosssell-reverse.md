# forsale-crosssell-reverse

## Goal
Close the one-directional gap in the make/model cross-sell: aircraft-for-sale detail
pages already show "N {make} {model} partnerships available" (`PartnershipCrossSellPanel`
+ `getPartnershipCrossSell`), but partnership detail pages have no equivalent panel
pointing a co-ownership shopper at whole aircraft for sale in the same make/model.

## Scope
- `src/lib/aircraftForSale.ts` — new `getForSaleCrossSell(make, model?)`, mirroring
  `getPartnershipCrossSell` in `src/lib/partnershipsQuery.ts`: model-level ILIKE match
  first (make+model), falls back to make-only when no model-level matches exist, returns
  `{ count, minPrice, modelLevel }` or `null`. Read-only, no schema change.
- `src/app/partnerships/[id]/page.tsx` — fetch `forSaleCrossSell` alongside the existing
  `partnerComp`/`impliedValueCheck` data fetches (same page, same request), and render a
  new `ForSaleCrossSellPanel` component (mirrors `PartnershipCrossSellPanel`'s markup/copy,
  reversed: "N {make} {model} for sale" + min asking price + CTA to
  `/aircraft?make=...&model=...`) in the sidebar, near the existing "Nearby alternatives"
  panel.

## Acceptance criteria
- On a partnership detail page for a make/model with active for-sale listings, a new
  panel shows "N {make} {model} aircraft for sale on ClubHanger" (or make-only if no
  model-level matches), with "From $X" when a price is available, and a working link to
  `/aircraft?make=...` (or `...&model=...`) that actually filters to matching listings.
- When there are zero matching for-sale listings, the panel renders nothing (no empty
  state / no broken link) — mirrors `PartnershipCrossSellPanel`'s self-suppression.
- No change to the existing aircraft-for-sale → partnerships direction (`PartnershipCrossSellPanel`
  untouched).
- `npx next build` + `tsc --noEmit` clean.
- QA smoke passes on `/partnerships/[id]` (an existing seeded id) at desktop 1280 + mobile 375:
  HTTP 200, zero app-origin console errors, zero horizontal overflow.
- Visual cycle (new rendered panel) — screenshots confirm it looks correct and doesn't
  break the existing sidebar layout.

## Out of scope
- Any change to the for-sale → partnerships direction.
- Geographic ("near {airport}") cross-sell — this slice is make/model only, matching the
  existing pattern.
- Any schema change.
