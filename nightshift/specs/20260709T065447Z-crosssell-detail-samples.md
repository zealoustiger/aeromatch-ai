# crosssell-detail-samples

## Goal
Add real sample listing cards to the two detail-page cross-sell panels (aircraft↔partnership) so a shopper sees actual matching listings from the other marketplace, not just a count — the "next slice" explicitly flagged in `BACKLOG.md`'s "Blend result types + cross-sell" item.

## Scope
- `src/lib/aircraftForSale.ts` — `getForSaleCrossSell()`: also fetch + return up to 3 real sample rows (`samples: AircraftForSale[]`) alongside the existing count/minPrice, at whichever level (model or make) matched.
- `src/lib/partnershipsQuery.ts` — `getPartnershipCrossSell()`: mirror the same change (`samples: Partnership[]`).
- `src/app/aircraft/listing/[id]/page.tsx` — `PartnershipCrossSellPanel`: render a compact horizontal mini-rail of up to 3 `PartnershipRailCard`s below the existing count/CTA (reuses the exact mini-rail markup `MarketplaceCrossSell` already uses).
- `src/app/partnerships/[id]/page.tsx` — `ForSaleCrossSellPanel`: same, with `AircraftRailCard`.

No schema/DB change. No new dependency. No FREEZE file touched.

## Acceptance criteria
- `/aircraft/listing/[id]` for a listing with an active same-make/model partnership shows up to 3 real partnership sample cards (photo, price, label, link to `/partnerships/[id]`) inside the existing "Co-ownership available" panel; panel still self-suppresses entirely when there are 0 matching partnerships (unchanged behavior).
- `/partnerships/[id]` for a listing with an active same-make/model for-sale aircraft shows up to 3 real aircraft sample cards inside the existing "Prefer to buy outright?" panel; same self-suppress-at-0 behavior.
- No fabricated/placeholder listings — only real rows already in the DB, mirroring the exact query the count/minPrice figures come from (same match level: model-level when available, else make-level).
- `npx tsc --noEmit` and `npx next build` both clean.
- `qa-smoke.mjs` passes (HTTP 200, zero app-origin console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on one aircraft listing detail page and one partnership detail page that both have live cross-sell matches.
- Screenshots confirm the mini-rail renders cleanly (no overflow) inside the narrower sidebar column on both viewports.

## Out of scope
- The "pilots" third result-type blend mentioned as a future idea in the same backlog bullet.
- Changing the count/CTA copy or the panel's overall layout beyond appending the rail.
- The browse-page (`/aircraft`, `/partnerships`) cross-sell card — already has samples (unaffected).
