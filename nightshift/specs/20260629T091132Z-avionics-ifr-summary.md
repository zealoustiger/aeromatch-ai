# Spec: avionics-ifr-summary
**Timestamp:** 20260629T091132Z
**Pillar:** Buyer analysis (Pillar 3)

## Goal
Add an IFR suitability verdict to the existing Avionics & Panel section on aircraft listing detail pages, and add an avionics signal row to the Deal Score tally — turning the raw equipment chips into a synthesized buyer read ("Full IFR touring setup" / "WAAS GPS — IFR-capable" / "Basic VFR panel") that no other listing site provides.

## Scope
Single file: `src/app/aircraft/listing/[id]/page.tsx`

- Add `computeIfrSuitability(caps)` function: maps the already-classified `AvionicsCap[]` into a tiered verdict (`full` / `capable` / `equipped` / `basic`) with a headline + sub-sentence. Self-suppresses (returns null) when no caps were detected (avionics data present but only raw items, no recognizable capabilities) or when `avionicsInfo` is null entirely.
- Update `AvionicsPanel` to render the IFR suitability verdict above the capability chips: a colored badge chip (emerald for full/capable, sky for equipped, slate for basic) + a short explanatory sentence.
- Pass `avionicsInfo` to `computeDealSignals` and add a new avionics signal row: positive ("IFR-capable") for full/capable tier, neutral ("Ask about avionics") when avionicsInfo is null, negative row omitted (no avionics = missing data, not a defect — the spec-completeness row already covers missing data).
- Update `DealScorePanel` call site to pass `avionicsInfo`.

## Acceptance criteria
1. An aircraft listing with WAAS GPS (e.g., GTN 750) and autopilot shows "IFR-capable: WAAS GPS + autopilot" (or "Full IFR touring setup" if glass is also present) at the top of the Avionics & Panel section, with an emerald or sky badge.
2. An aircraft with only basic ADS-B Out shows "ADS-B compliant" with a slate badge; no fabricated IFR claim.
3. A listing with no avionics data (`avionicsInfo === null`) shows no AvionicsPanel at all — self-suppression unchanged.
4. The Deal Score "How this stacks up" tally includes a positive "IFR-capable" row for aircraft in the `full` or `capable` IFR tier.
5. `npx next build` passes. `tsc --noEmit` exits 0.
6. `qa-smoke.mjs` exits 0 on a live aircraft listing at desktop 1280 + mobile 375.

## Out of scope
- New DB queries or schema changes.
- Modifying `avionicsClassify.ts` (the classifier is sufficient; this is a display layer only).
- Adding IFR suitability to partnership or seeker pages.
- Changing the Deal Score when `avionicsInfo` has caps but none in the full/capable tier (omit avionics from Deal Score in that case — don't add noise).
