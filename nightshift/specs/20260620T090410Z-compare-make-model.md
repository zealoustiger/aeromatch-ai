# Compare on make+model for-sale pages

**Lane:** [want] · **Scoreboard at orient:** 60 pageviews/7d
**Slug:** compare-make-model · **Branch:** night/compare-make-model (off staging)

## Goal
Extend the existing listing-comparison system (shipped tonight for `/aircraft` and
`/partnerships`) to the `/aircraft/[make]/[model]` for-sale pages, so visitors on a
make+model landing page can select 2–3 aircraft and open the side-by-side compare view.

## Why this grows value
This is the explicit "Next" from the compare-aircraft cycle. The make+model pages
already render `AircraftSaleCard`, which now carries `<CompareToggle type="aircraft">`,
so the toggles already render — they just have no `CompareProvider` context or tray to
populate. Wiring the provider + tray gives parity with `/aircraft` and lets users
compare directly from a high-intent family page without bouncing to the index.

## Scope (files expected to touch)
- `src/app/aircraft/[make]/[model]/page.tsx` — import `CompareProvider` + `CompareTray`,
  wrap the page's root `<div>` in `<CompareProvider>`, add `pb-28` to that div so the
  fixed tray never overlaps content, mount `<CompareTray />` after the div. Mirror
  exactly how `/aircraft/page.tsx` and `/partnerships` were wired.

## Acceptance criteria (QA grades against these)
1. `npx next build` is green and `npx tsc --noEmit` shows no NEW errors in touched
   files (the 3 pre-existing `.test.ts` import-extension errors in
   aircraftJsonLd/calculators/partnershipTrust are the known baseline — ignore only those).
2. On a `/aircraft/[make]/[model]` page (e.g. `/aircraft/cessna/172`), each for-sale
   card shows a working sky "Compare" toggle and selecting cards populates the fixed
   bottom compare tray (chips, `N/3` counter, Clear, "Compare (N)").
3. The tray's "Compare (N)" button opens `/compare?type=aircraft&ids=…` and the
   side-by-side aircraft table renders the selected listings.
4. `pb-28` bottom spacing is present so the fixed tray never overlaps page content.
5. No new console errors / hydration warnings at desktop (1280) or 375px mobile; no
   horizontal overflow at 375px.
6. Sky-blue accent only; no schema/DB change; no other page families touched.

## Out of scope
- `/partnerships/[id]` or any other route family.
- Any change to CompareProvider / CompareTray / CompareToggle / AircraftSaleCard
  internals (already shipped and type-aware).
- Schema / DB changes (selection stays client-side via sessionStorage).
- New compare features (labels, etc.) — strictly parity wiring.
