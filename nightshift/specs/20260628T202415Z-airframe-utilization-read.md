# Airframe utilization read — proprietary buyer analysis (Pillar 3)

## Goal
On the aircraft listing detail page, turn the raw **TTAF** spec into an honest, proprietary
read on **how hard the airframe has been flown over its life** (average hours/year), with
two-sided guidance — a buyer signal no listing site offers, distinct from the SMOH-based
Engine Life panel.

## Why (pillar + friction/value)
Pillar 3 (proprietary, honest buyer-analysis). Rotation: last cycles ran P1, P3, P1, P2, P3,
P1 — Pillar 1 was the immediately-prior cycle (and the most-frequent recently); Pillar 2's
headline items are human-blocked behind the frozen `/auth`. Pillar 3 is the rotation-correct,
unblocked pillar. A 40-year-old airframe with 8,000 hrs vs 2,000 hrs are very different
aircraft; "average hrs/year" is a genuine decision signal currently buried as a single number.

## Scope (small)
- **New** `src/lib/airframeUsage.ts` — pure helper `computeAirframeUsage({ ttaf, year }, now)`.
  Returns `null` (self-suppresses) when `ttaf`/`year` missing, `ttaf <= 0`, or age `< 1`.
  Classifies avg hrs/yr into low / typical / high with honest, two-sided copy.
- **`src/app/aircraft/listing/[id]/page.tsx`** — compute the read and render a compact
  `AirframeUsagePanel` right after the Engine Life panel (mirrors its visual style).
- No schema, no new DB reads, no network calls, no new deps.

## Acceptance criteria
- A listing with both `ttaf` and `year` shows an "Airframe time" panel with the average
  hrs/yr, a low/typical/high label, and honest two-sided guidance.
- The read is **honesty-gated**: a listing missing `ttaf` or `year` (or year ≥ current year,
  or ttaf 0) renders **no** panel (helper returns null) — never a fabricated number.
- Copy is clearly framed as a life-average rule of thumb (not a guarantee); low utilization
  is presented with its real downside (sitting risks), not as strictly good.
- It is visually and numerically distinct from the Engine Life (SMOH) panel — airframe total
  time over the aircraft's life, not engine-since-overhaul.
- `npx next build` + typecheck pass clean.
- QA smoke (desktop 1280 + mobile 375) exits 0 on the affected listing page: HTTP 200, no
  app-origin console errors, no horizontal overflow. Screenshots reviewed (visual cycle).

## Out of scope
- No change to the Deal Score / Estimate / Engine Life / cost-to-own panels.
- No new comp queries or type-specific TTAF benchmarks (would risk fabrication) — the read is
  purely the listing's own ttaf ÷ age, framed as a life average.
- No changes to the post forms, partnership/seeker pages, or any auth/signup surface.
