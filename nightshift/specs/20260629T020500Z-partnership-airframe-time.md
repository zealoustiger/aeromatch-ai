# partnership-airframe-time

**Goal (one sentence):** Bring the honest "Airframe time" buyer-analysis module (average
hrs/year over the aircraft's life, from `ttaf` + `year`) onto the partnership detail page,
so co-ownership shoppers get the same airframe-utilization read the aircraft-for-sale page
already shows.

**Pillar:** 3 — Proprietary buyer analysis on listing pages. Extends an existing, already
honesty-gated and unit-tested module (`computeAirframeUsage`) onto a second listing surface
(partnerships), where it currently does not render despite the data being present.

## Scope (files I expect to touch — keep small)
- `src/app/partnerships/[id]/page.tsx` — import `computeAirframeUsage`, compute it from the
  partnership's `ttaf` + `year`, render an `AirframeUsagePanel` in the main column (next to
  the existing Engine Life panel). Port the local `AirframeUsagePanel` + `USAGE_META`
  presentation from the aircraft detail page (same look).
- No lib changes (reuse `src/lib/airframeUsage.ts` as-is). No schema, no query changes
  (`getPartnershipById` already `select('*')`, so `ttaf`/`year` are present).

## Acceptance criteria
- The partnership detail page renders an "Airframe time" panel showing ≈X hrs/yr + band
  chip (Low time / Typical / High time) + two-sided guidance, ONLY when both `ttaf` and
  `year` are present and age ≥ 1 yr (self-suppresses otherwise — never fabricates).
- A partnership missing `ttaf` or `year` renders NO airframe panel (no empty/"null" panel).
- Visual parity with the aircraft page's Airframe time panel (same `ch-panel` styling,
  Plane icon, band chip colors).
- `npx next build` + typecheck pass.
- QA smoke (desktop 1280 + mobile 375) on a partnership detail URL: HTTP 200, zero
  app-origin console errors, zero horizontal overflow; screenshots look correct.

## Out of scope
- No changes to the Engine Life, Deal Signals, Market Check, or Cost Calculator panels.
- No new DB columns, no annual-due/damage-history modules (those columns don't exist on
  partnerships).
- No copy rewrite of `airframeUsage.ts` (the "personal aircraft" phrasing applies equally
  to a shared airframe).
