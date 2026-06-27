# Spec: deal-score-panel

**Goal:** Add a "How this stacks up" Deal Score panel to the aircraft listing detail page that synthesizes the buyer-relevant signals already computed on the page (price positioning, days on market, price history, spec completeness) into one scannable, transparent summary — so a buyer doesn't have to hunt across four separate panels to read the story.

**Scope:**
- `src/app/aircraft/listing/[id]/page.tsx` — add `computeDealSignals` helper + `DealScorePanel` component; render it between the Specs grid and the Engine Life panel in the main content column

**Acceptance criteria:**
1. A "How this stacks up" panel renders in the main content column of `/aircraft/listing/[id]` between the Specs grid and the Engine Life panel.
2. The panel shows up to 4 signal rows: (a) price positioning (from Deal Check or family Estimate — whichever is available, preferring Deal Check as more controlled), (b) days on market (from `first_seen_at`), (c) price history (if a price change exists), (d) spec completeness (count of key fields: year, ttaf, smoh, engine_type, registration).
3. Each signal row has a colored indicator (emerald for positive, slate for neutral, amber for negative), a bold label, and a plain-language detail line explaining what it means for a buyer.
4. The panel self-suppresses completely (returns null) when fewer than 2 signals are actionable (e.g. no price, no first_seen_at, no comps — thin data).
5. No new DB queries, no new dependencies — all inputs are data already fetched/computed in the page component.
6. `npx next build` passes with no TypeScript errors.
7. QA smoke exits 0 on the listing detail page at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero horizontal overflow).

**Out of scope:**
- A numeric composite "score" (no black-box number — the panel shows transparent reasons, not a magic score).
- Any new data fetching (everything is derived from what the page already computes).
- Applying this to partnership or seeker listing pages.
