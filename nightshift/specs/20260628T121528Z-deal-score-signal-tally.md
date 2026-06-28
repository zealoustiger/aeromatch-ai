# Deal Score signal tally header

**Slug:** `deal-score-signal-tally`
**Pillar:** 3 — Proprietary buyer analysis on listing pages
**Type:** VISUAL (renders a new summary header inside an existing panel)

## Goal
Give the aircraft listing's "How this stacks up" (Deal Score) panel an at-a-glance,
honest synthesis header — a count of the favorable vs. watch-out signals already
listed below — so a buyer reads the bottom line in one glance instead of mentally
tallying the rows.

## Why (activation rationale)
Pillar 3's Deal Score panel (`deal-score-panel`) already synthesizes our proprietary
signals (comp price position, days-on-market, price history, spec completeness) into a
transparent list of reasons. But it presents them as a flat list — the buyer still has
to scan and count to form a verdict. The BACKLOG Deal Score item explicitly wants "one
honest verdict ... with the *reasons* shown (not a black-box score)." This slice adds
the verdict-at-a-glance layer while keeping every reason visible. It is **honest by
construction**: the header only counts rows the panel already computed and shows — it
fabricates nothing, invents no score, and adds no new claim. Neutral/context rows
(e.g. "listed 2 weeks ago") are excluded from the for/against tally so the count never
overstates.

The aircraft-detail Pillar-3 P1/P2 backlog is exhausted (engine life, cost-to-own,
estimate range/spread, Deal Score, avionics all shipped), so this is an invented
`[agent][goal]` Pillar-3 slice that sharpens the flagship module rather than adding a
new one.

## Scope (files)
- `src/app/aircraft/listing/[id]/page.tsx` — `DealScorePanel` only: compute
  positive/negative counts from the existing `rows`, render a small summary header
  above the existing list. No new data, no query, no new module.

## Acceptance criteria
- [ ] The "How this stacks up" panel shows a summary header derived purely from the
      already-rendered rows: a count of favorable signals (`kind === 'positive'`) and a
      count of watch-out signals (`kind === 'negative'`). Neutral rows are NOT counted
      in either.
- [ ] Copy is descriptive, not a score/grade/endorsement (e.g. "in this listing's
      favor" / "to ask about"), consistent with the existing honesty caveats already in
      the panel.
- [ ] When there are only favorable signals, the header reads favorable-only; only
      watch-outs → watch-out-only; both → both; the panel still self-suppresses entirely
      when `rows.length < 2` (unchanged).
- [ ] `npx next build` + typecheck pass clean.
- [ ] QA smoke (production build) exits 0 on an aircraft listing detail page that
      renders the panel + `/aircraft`, at desktop 1280 + mobile 375 (HTTP 200, no
      app-origin console errors, no horizontal overflow).
- [ ] Screenshots reviewed (visual cycle): the header renders cleanly above the signal
      list at both viewports, no overlap/overflow.

## Out of scope
- No new signals, scores, grades, or numeric "deal scores".
- No change to `computeDealSignals` or the underlying signal logic.
- No change to other panels (Estimate, Engine Life, Avionics, Cost-to-own).
- No browse-card / rail changes.
