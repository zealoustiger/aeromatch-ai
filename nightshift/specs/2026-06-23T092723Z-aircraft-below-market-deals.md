# Spec — Aircraft "priced below market" deals page (`/aircraft/deals`)

**Lane:** `[want]` (last non-bug cycle `home-forsale-make-links` pulled `[goal]`; last cycle PASS → no blocker → `[want]` owed per the 1:1).
**Backlog item:** `[P2][want] "Great Deals" view + homepage rail` (Brainstorm 2026-06-20, section B — engagement). Slice (2): a `/aircraft/deals` view. (Slice 1, the homepage rail, is deferred to a follow-up — see Out of scope.)

## Goal
Ship a genuinely-useful **"aircraft priced below market"** view at `/aircraft/deals` that surfaces active listings asking meaningfully less than the median of comparable same-make+model listings — a concrete reason for buyers to save/return (the Redfin "hot homes" engagement loop), reusing the already-shipped, unit-safe comp model. New indexable page is a leading-indicator bonus while STAGE=INDEXING.

## Scope (small)
- **New** `src/app/aircraft/deals/page.tsx` — server component: fetches under-market deals, renders intro + caveat + a vertical list of `AircraftSaleCard` (with its existing comp pill). `generateMetadata`/`metadata` with self-canonical + OG/Twitter. Honest empty-state (no fabrication).
- **`src/components/AircraftSaleList.tsx`** — add an exported `fetchUnderMarketDeals(limit)` helper (co-located with the other fetch/floor helpers so the query, site quality-floor, and comp logic stay single-source). Reuses the private `fetchFamilyPriceMap()` + `compVsMarket()` + `familyKey()`.
- **`src/app/aircraft/page.tsx`** — one tasteful internal link ("See aircraft priced below market") in the page header so users + crawlers reach the new page.
- **`src/app/sitemap.ts`** — add `/aircraft/deals` to the static routes (with `aircraftLastMod`).

## Acceptance criteria
1. `/aircraft/deals` returns HTTP 200, renders a list of real active listings, each genuinely **below** its family median (`compVsMarket` → `kind:'below'`), sorted by largest discount first, with the existing emerald "~X% below average" pill on each card.
2. Only honest deals: candidates require `asking_price >= $50,000` (site real-aircraft floor), the site quality floor, `compVsMarket` ≥ `MIN_OTHER_COMPS` (4) other comps, AND a discount ≥ `DEAL_MIN_PCT` (10%). A prominent caveat states it is a **price-only** comparison (not adjusted for year/hours/avionics/condition). No fabricated/padded rows; if zero qualify, show a friendly empty state linking back to `/aircraft`.
3. A per-family cap (≤6 per make+model) keeps one family from flooding the page.
4. `/aircraft` shows a working internal link to `/aircraft/deals`; `/aircraft/deals` is in `sitemap.xml`; page has a self-referential canonical + OG/Twitter metadata.
5. `npx next build` + typecheck pass. QA smoke (desktop 1280 + mobile 375) passes for `/aircraft/deals` and `/aircraft`: HTTP 200, zero app-origin console errors, zero horizontal overflow. Screenshots look right.

## Out of scope
- The homepage "Great Deals" rail (slice 1) — deferred follow-up; this builds the destination page first.
- Any change to the comp math (`aircraftComps.ts`), the per-card pill, or `/aircraft` list behavior.
- JSON-LD / ItemList markup, saved-heart hydration on the deals page, an endorsement-style "good deal" score (deferred until year-band+hours comps exist), DB/schema changes.
