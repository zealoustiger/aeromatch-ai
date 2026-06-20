# Etsy × Airbnb visual refresh — slice 1: design tokens + reference surface

## Goal
Establish a shared, warm Etsy×Airbnb visual language as reusable design tokens, and apply it to ONE reference surface — the `/aircraft` listing page chrome + `AircraftSaleCard` — so the look is cohesive and reversible, with the tokens documented for later slices.

## Scope (small, additive)
- `src/app/globals.css` — add documented design tokens under `@theme` / `:root`: a warm cream surface (`--ch-surface`, `--ch-surface-2`), card radius (`--ch-radius-card` = `rounded-2xl`/1rem), a soft card shadow + a hover-lift shadow. Add one small utility class `.ch-card` (radius + soft shadow + hover-lift translate/scale) and a `.ch-surface` background helper. No global body change (keep other pages untouched).
- `src/app/aircraft/page.tsx` — wrap the reference surface in a warm cream surface, soften the page-chrome panels (filters sidebar, by-state block) to the new card radius/shadow, and warm the H1 treatment slightly. Reference surface only.
- `src/components/AircraftSaleCard.tsx` — adopt the new card token (`rounded-2xl`, soft shadow, hover-lift), minimal border, larger photo corners. Keep all existing badges/content/links/behavior identical.

## Acceptance criteria
1. `/aircraft` renders with a warm cream page surface (not cold slate-gray/pure white) at desktop AND 375px.
2. `AircraftSaleCard` uses the new rounded-2xl card with a soft shadow that lifts on hover; no hard slate border by default; all existing badges, price block, save heart, compare toggle, and links still render and work.
3. The filters sidebar panel and "by state" block on `/aircraft` use the same card radius/shadow language (cohesive).
4. Tokens are defined once in `globals.css` with a short comment block documenting them for later slices.
5. `npx next build` passes (build + typecheck). No new console errors on `/aircraft`. No layout overflow at 375px.
6. No other page family is visually changed (no global body/background edit).

## Out of scope
- Card content/markup redesign beyond radius/shadow/border (that's slice 2: AircraftSaleCard + PartnershipCard full redesign).
- Category chip bar (slice 3), homepage rails (slice 4), token sweep to other pages (slice 5).
- Logo / name / accent-color / font-family swap — keep the sky accent; warm only the neutrals this cycle (cohesive + reversible).
- Any schema/DB/SQL/backend change.
