# Unique content depth — slice 3: "Buying an aircraft in {State}" prose on for-sale state pages

**Lane:** `[goal]` (last non-bug cycle `partnerships-chip-bar` was `[want]`; 1:1 owes `[goal]`). No blocker (last cycle PASS).

## Goal
Give each curated `/aircraft/for-sale/[state]` page a genuinely unique 2-paragraph market-overview intro so it reads as editorial content depth, not a templated count-only landing page Google deprioritizes in the INDEXING stage — the for-sale state family targets the #1 autocomplete pattern ("aircraft for sale california").

## Scope (small, additive)
- `src/lib/seo.ts` — add a `FORSALE_STATE_OVERVIEWS: Record<string, string[]>` map (keyed by lowercase USPS code) + a `getForSaleStateOverview(code)` helper, mirroring `getForSaleStateFaqs`.
- `src/app/aircraft/for-sale/[state]/page.tsx` — render the overview as a "Buying an aircraft in {State}" section near the top (below the header paragraph, above the AlertSignup), curated states only.

Curated set: ca, tx, fl, az, co, wa (same six high-GA states already carrying for-sale-state FAQs — each page now has narrative prose + Q&A, the proven make/model pattern).

## Acceptance criteria
- The 6 curated for-sale state pages each render a 2-paragraph "Buying an aircraft in {State}" prose section, distinct in wording from that page's existing FAQ Q&As (narrative market overview, not questions).
- Non-curated states (e.g. ohio, new-york) render NO overview section and still return 200 with the ItemList intact.
- The prose contains NO fabricated statistics and NO live listing counts (never goes stale).
- `npx next build` + typecheck pass.
- QA smoke exit 0 at desktop 1280 + mobile 375 on 3 curated pages; screenshots look right; no console errors; no horizontal overflow.

## Out of scope
- Partnership state pages, make/model/airport overviews (later slices).
- Any new component, color, dependency, JSON-LD, or schema/DB/SQL change.
- Adding overview prose to non-curated (dynamic) states.
