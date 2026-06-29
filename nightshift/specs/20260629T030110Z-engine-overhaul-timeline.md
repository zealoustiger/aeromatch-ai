# Spec — engine-overhaul-timeline

## Goal
On a listing's Engine Life read, answer the buyer's real calendar question — "how many
**years** until I'm on the hook for an overhaul?" — by fusing the engine's hours-remaining-
to-TBO with *this aircraft's own historical flying rate* (TTAF ÷ age), a proprietary,
honesty-gated synthesis no listing site offers.

## Pillar
Pillar 3 — proprietary buyer analysis. Rotation: last cycle was Pillar 1
(ai-prefill-faa-backfill); Pillar 2's headline items (Google OAuth / email-only signup)
remain human-blocked behind the frozen `/auth`, so Pillar 3 is rotation-correct and due.

## Why this is proprietary + honest
- Hours-to-TBO alone (already shown) doesn't tell a buyer *when* the overhaul lands: 600 hrs
  remaining is ~12 years for a 50 hrs/yr flyer but ~4 years for a 150 hrs/yr flyer. We already
  compute both the remaining hours (`computeEngineLife`) and the plane's real utilization
  (`computeAirframeUsage`) — fusing them is a calendar estimate the big sites never surface.
- Honesty-gated: self-suppresses when the engine is at/beyond TBO (the panel already handles
  that case), when utilization is unknown (ttaf/year missing), or when hrs/yr ≤ 0. Framed as a
  rough projection off the aircraft's *historical* rate — explicitly "your actual rate will differ."
  No fabricated number; uses only the two reads already on the page.

## Scope (small)
- New pure lib `src/lib/overhaulTimeline.ts` — `computeOverhaulTimeline({ remainingHours, hoursPerYear })`
  → `{ remainingHours, hoursPerYear, yearsToTbo } | null`. Self-suppresses per the rules above.
- New unit test `src/lib/overhaulTimeline.test.ts` (node:test) — suppression cases + a couple of
  rate→years computations + rounding.
- Wire into the existing **Engine Life** panel on both listing surfaces (render an extra line,
  NOT a new panel), passing the result through an optional prop:
  - `src/app/aircraft/listing/[id]/page.tsx`
  - `src/app/partnerships/[id]/page.tsx`

## Acceptance criteria
- [ ] `computeOverhaulTimeline` returns null when remainingHours ≤ 0, hoursPerYear ≤ 0, or either
      is non-finite; otherwise returns yearsToTbo = remainingHours/hoursPerYear, rounded to the
      nearest 0.5 year and floored at 0.5. Unit tests cover these.
- [ ] On both listing detail pages, when (and only when) the Engine Life panel renders, the engine
      is within TBO, AND an airframe-utilization read exists, an extra honest line shows
      "≈ N years to overhaul at its historical ~M hrs/yr" with a rule-of-thumb caveat.
- [ ] When the engine is beyond TBO, or ttaf/year is missing, NO timeline line renders (existing
      panel copy unchanged).
- [ ] `npx next build` + typecheck pass; the new test passes.
- [ ] QA smoke (desktop 1280 + mobile 375) exits 0 on the two detail pages; screenshots look right.

## Out of scope
- No schema/DB/query changes; no change to engineLife/airframeUsage math.
- No change to the standalone reserve number or the cost-to-own panels.
- No new panel chrome — a single fused line inside the existing Engine Life card.
