# Deal Score — fold engine-life-vs-TBO into the "How this stacks up" tally

**Slug:** `deal-score-engine-life`
**Pillar:** 3 — Proprietary buyer analysis on listing pages
**Date:** 2026-06-29

## Goal
Add the engine's position relative to its published TBO as one more honest signal row
in the aircraft listing's "How this stacks up" (Deal Score) tally, so the at-a-glance
verdict also reflects how much engine life remains before an overhaul — not just price,
listing age, annual status, damage, and spec completeness.

## Why this slice
The recent `deal-score-maintenance-signals` CHANGELOG `Next:` line named the engine-life
read as "the only remaining computed-on-page read NOT in the tally." `computeEngineLife`
is already called on the page (feeds the EngineLifePanel) and is honesty-gated
(self-suppresses when smoh/engine_type missing or the engine can't be matched to a known
TBO family). This is the same "reuse an already-computed, already-tested read in the
headline tally" move that landed annual + damage — no new data, query, or fabrication.

## Scope (small)
- `src/app/aircraft/listing/[id]/page.tsx` only:
  - Add `engineLife: EngineLifeResult | null` param to `computeDealSignals` and pass it
    at the call site (line ~647).
  - Add an engine-life section to `computeDealSignals` (after damage, before spec
    completeness). Bands MIRROR the existing EngineLifePanel progress-bar thresholds so
    the tally chip and the bar a buyer sees right below it always agree:
    - `beyondTbo` → **negative** "Engine past TBO" (X hrs past, ~$overhaul to budget).
    - `>40%` of TBO remaining → **positive** "Engine has life left".
    - `15–40%` remaining → **neutral** "Mid-time engine" (note the ~reserve/yr).
    - `≤15%` remaining → **negative** "Approaching TBO" (overhaul on the horizon).
  - Update the panel footer line to mention engine time as a tally input.

## Acceptance criteria
- `npx next build` + `tsc --noEmit` green (no new errors in the touched file).
- The Deal Score panel shows an engine-life row ONLY when `computeEngineLife` returns
  non-null (smoh + a matchable engine_type present); it self-suppresses otherwise — no
  fabricated TBO, no row when the engine is unknown.
- The row's kind (favor / to-ask-about / neutral) matches the EngineLifePanel bar color
  band (>40% green, 15–40% amber, ≤15%/past concern) for the same listing.
- The "N in this listing's favor / N to ask about" chips update consistently (a fresh
  engine adds to favor; a past/near-TBO engine adds to ask-about; mid-time is neutral
  and counts to neither).
- QA smoke exit 0 on `/aircraft/listing/[id]` at desktop 1280 + mobile 375 (HTTP 200,
  zero app-origin console errors, zero horizontal overflow); panel renders cleanly.

## Out of scope
- No new DB columns, queries, extraction, or a composite numeric score.
- No change to `computeEngineLife`, the EngineLifePanel, or any other panel.
- No change to the partnership detail page.
