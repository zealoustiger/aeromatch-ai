# Spec — Prune thin `/airports/[icao]` pages (sitemap + noindex)

**Slug:** `airport-thinpage-prune`
**Lane:** `[goal]` — `[P1][goal] Thin-page pruning` (Brainstorm 2026-06-20 §A), airport family.
**Stage:** INDEXING. Last non-bug cycle (marketplace-cross-sell) pulled `[want]`, so `[goal]` is owed (1:1).

## Goal
Stop ~16,800 thin, near-identical `/airports/[icao]` pages from diluting Google's
crawl budget: emit only airport pages with **real based-here partnership inventory**
in the sitemap, and mark every other airport page `noindex, follow`.

## Why this grows pageviews (INDEXING-stage leading indicator)
The `airports` table holds **16,885** rows, but only **9** distinct airports have any
active partnership based there. The `/airports/[icao]` page surfaces only partnerships
*at / near* the airport, so the other ~16,876 render a thin "No active partnerships
based at KXXX yet — Post the first one" page. Today **all 16,885** are in `sitemap.xml`
(`priority 0.8, daily`). At STAGE=INDEXING (indexed ≈ 0), that is a thin/doorway-page
farm: it wastes crawl budget Google would otherwise spend on the ~200 pages with real
content (make/model/state/guide/listing), and risks a sitewide quality penalty
(GOAL.md guardrail: "No doorway / thin / near-duplicate pages"). Every other
programmatic family (`/partnerships/near`, make, model, state, make+model+state) is
already gated to emit only inventory-backed URLs — airports are the lone exception.
This completes that pattern.

## Rule (single source of truth)
An `/airports/[icao]` page is **index-worthy iff ≥ 1 active partnership is based at
that airport** (`home_airport === icao`). This is the page's own "Based at {ICAO}"
section having ≥1 real card — honest, and mirrors the existing near-hub design
(candidates = the inventory's home airports, deliberately avoiding near-duplicate
sprawl across thousands of airports that merely sit near a cluster). Airports that
show only *nearby* listings are near-duplicates of the home-airport page; the
canonical geo page for that is `/partnerships/near/[icao]` (already gated/indexed).

## Scope (small, additive)
- `src/lib/nearbyPartnerships.ts` — add two helpers expressing the one rule above:
  - `getIndexableAirportIcaos(): Promise<string[]>` — batch (sitemap): distinct
    active `home_airport` codes, validated against the `airports` table, lowercased.
  - `isAirportIndexable(icao): Promise<boolean>` — single (page metadata).
- `src/app/sitemap.ts` — replace the "all airports" query with
  `getIndexableAirportIcaos()` (mirrors the gating comments on the other families).
- `src/app/airports/[icao]/page.tsx` — in `generateMetadata`, set
  `robots: { index: false, follow: true }` when the airport is not index-worthy
  (omit `robots` otherwise → default index,follow). No body/visual change.

## Acceptance criteria
1. `npx next build` + `tsc --noEmit` green (modulo the 4 pre-existing `.test.ts` baseline errors).
2. Sitemap emits only inventory-backed airport URLs: the airport section drops from
   16,885 to the handful with based-here inventory (≈9); a known thin airport URL
   (e.g. `/airports/kjfk`) is **absent** from `sitemap.xml`; an indexable one
   (e.g. `/airports/kpao`) is **present**.
3. A thin airport page (e.g. `/airports/kjfk`) returns **HTTP 200** and its head
   carries `<meta name="robots" content="noindex, follow">` (page still renders +
   links still followed — not removed).
4. An indexable airport page (e.g. `/airports/kpao`) returns **HTTP 200** with **no**
   `noindex` (default index,follow), renders its based-here listings, and is visually
   unchanged from before.
5. QA smoke exit 0 (HTTP 200, zero app-origin console errors, zero horizontal overflow)
   at desktop 1280 + mobile 375 on both an indexable and a thin airport page.

## Out of scope
- Pruning the `/aircraft` thin families (separate slice; already inventory-gated anyway).
- Any change to the airport page body, content, JSON-LD, or styling.
- Adding canonical-to-parent rewrites (noindex,follow is sufficient; canonical stays self).
- Schema/DB/SQL, new components/colors/dependencies, FREEZE files.
