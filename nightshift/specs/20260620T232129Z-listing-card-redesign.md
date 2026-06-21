# Etsy × Airbnb visual refresh — slice 2: listing-card redesign

## Goal
Bring `AircraftSaleCard` and `PartnershipCard` to a cohesive Airbnb-style look on the slice-1 `globals.css` tokens — bigger photo, bold price, heart top-right, badges + location, soft hover-lift, minimal borders — with the two cards at visual parity. 375px-first.

## Scope (small)
- `src/components/AircraftSaleCard.tsx` — refine toward Airbnb (already on `.ch-card` with heart/comp/trust/grade): drop the hard `border-slate-100`, lean on the soft shadow; bigger photo on mobile; bolder price treatment.
- `src/components/PartnershipCard.tsx` — bring to parity: swap its bespoke `rounded-xl border shadow-sm hover:*` for `.ch-card`, remove the hard border, larger mobile photo, bolder price.
- No globals.css change (reuse existing tokens). No new component, no new color, no new dependency.

## Acceptance criteria
1. Both cards render via `.ch-card` (rounded-2xl radius, soft resting shadow, hover-lift) with NO hard slate border — the shadow does the separation.
2. Photo is larger on mobile (≥ h-52 at 375px) on both cards; heart stays top-right over the photo.
3. Price/buy-in is bold and prominent on both cards (kept their existing fields/labels; no data change).
4. `/aircraft` and `/partnerships` both render correctly at desktop (1280) and 375px with ZERO horizontal overflow and zero new console errors.
5. All existing card affordances still work: heart/save, compare toggle, trust + grade badges, source/price-drop/new badges, location link, source/view links, make+model family link (aircraft).
6. `npx next build` + typecheck pass.

## Out of scope
- No globals.css/token changes; no category chip bar (slice 3); no homepage rails (slice 4).
- No data/schema/SQL changes; no changes to SaveListingButton/TrustBadge/CompareToggle internals.
- No other pages/components restyled (token sweep is slice 5).
