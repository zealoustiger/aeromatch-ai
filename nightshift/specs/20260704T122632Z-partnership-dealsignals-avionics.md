# partnership-dealsignals-avionics

## Goal
Add the avionics/IFR-suitability row to the partnership detail page's "How this partnership
stacks up" synthesis panel (`PartnershipDealSignals`), matching the aircraft-for-sale page's
`computeDealSignals` equivalent — the slice explicitly flagged as "next" in the
`partnership-dealsignals-annual-damage` cycle (2026-07-04).

## Scope
- `src/components/PartnershipDealSignals.tsx` — add `avionicsInfo: AvionicsInfo | null` param to
  `computeSignals` and the exported component's props; insert one new row mirroring
  `src/app/aircraft/listing/[id]/page.tsx` lines 295–308 verbatim in logic: call
  `computeIfrSuitability(avionicsInfo.caps)`, only push a row when tier is `'full'` or
  `'capable'`, always `kind: 'positive'`, label/detail from `ifr.headline`/`ifr.sub`. Import
  `computeIfrSuitability` and the `AvionicsInfo` type from `@/lib/avionicsClassify`.
- `src/app/partnerships/[id]/page.tsx` — pass the already-computed `avionicsInfo` (line 351)
  into the `<PartnershipDealSignals ... />` call site (line 520) as the new prop.
- No schema change, no new query — `avionicsInfo` is already derived from `p.description` via
  `classifyAvionics()` on this page for the standalone `AvionicsPanel`.

## Acceptance criteria
- `PartnershipDealSignals` renders a new positive-only row when a partnership's classified
  avionics reach `'full'` or `'capable'` IFR tier, with copy identical in style to the aircraft
  page's row (e.g. "Full IFR touring setup" / "Glass panel with autopilot").
- Row is absent (self-suppresses) when `avionicsInfo` is null or the IFR tier is `'equipped'`,
  `'basic'`, or null — matching the aircraft page's exact gating, so the panel never fabricates
  a claim from thin signal.
- No behavior change to the other 8 existing rows in the panel.
- `npx tsc --noEmit` and `npx next build` pass clean.
- QA smoke passes on `/partnerships/[id]` (a real listing) at desktop 1280 + mobile 375: HTTP
  200, zero app-origin console errors, zero horizontal overflow.
- Visual QA: screenshots confirm the new row (if it fires for the sampled listing) or the
  panel's unchanged layout (if it self-suppresses) look correct — no overlap/layout shift.

## Out of scope
- Adding avionics rows to browse/rail cards (already shipped via `partnership-card-avionics-badge`).
- Any change to `classifyAvionics`/`computeIfrSuitability` tier logic itself.
- Aircraft-side page — already has this row.
