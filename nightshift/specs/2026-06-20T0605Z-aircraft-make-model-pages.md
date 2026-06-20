# Aircraft-for-sale make+model pages — SLICE 1

Lane: `[goal]` · Scoreboard at orient: **54** pageviews (7d)

## Goal
Ship a new programmatic page family `/aircraft/[make]/[model]` (e.g. `/aircraft/cessna/172`)
that lists all matching for-sale aircraft for that make+model, plus a short model-specs
+ cost-to-own blurb — the #1 keyword pattern (`{make} {model} for sale`) per the BACKLOG
keyword research. This slice covers **only the route + the top ~20 make/model combos by
real inventory**.

## Scope (files expected to touch)
- `src/lib/seo.ts` — add a curated `SEO_MAKE_MODELS` table (slug + display + `ilike`
  model pattern + verified inventory note + short specs + cost-to-own blurb).
- `src/components/AircraftSaleList.tsx` — add an optional `modelPattern` / `notModelPattern`
  filter (family-level `ilike` model match) so the new page can list a whole model family
  (the existing `model` filter is exact `.eq`, too narrow for messy model strings).
- `src/app/aircraft/[make]/[model]/page.tsx` — the new dynamic route (NEW dir).

## Top 20 combos (by active inventory, queried 2026-06-20; normalized model families)
Cirrus SR22 (115), Mooney M20 (66), Beechcraft Bonanza (61), Cirrus SR22T (53),
Cessna 182 (45), Cirrus SR20 (44), Cessna 172 (40), Piper Cherokee (25),
Beechcraft Baron (22), Piper Arrow (21), Piper Comanche (21), Bellanca Citabria (20),
Van's RV (17), Cessna 150 (15), Piper Cub (14), Cessna 180 (13), Piper Saratoga (11),
Grumman AA-1 (8), Grumman AA-5 (6), Robinson R44 (6). All ≥6 real active listings — no thin pages.

## Acceptance criteria
1. `/aircraft/cessna/172` (and the other 19 combos) renders real matching for-sale
   listings from the DB — never an empty/thin page (every combo has ≥6 active listings).
2. Unique per-page `<h1>`, `<title>` (`"{Make} {Model} for sale — {N} aircraft | ClubHanger"`),
   and meta description; a `<link rel=canonical>` to the page's own URL.
3. The page shows model specs + a short cost-to-own blurb (genuine, non-stuffed content).
4. An unknown combo (`/aircraft/cessna/zzz`) returns 404 (`notFound()`), not a thin page.
5. Mobile-first: no horizontal overflow at 375px; sky-blue accent only (no new palette).
6. `npx next build` + typecheck pass; production build (`npm run start`) QA at desktop +
   375px shows no new console errors / hydration warnings.

## Out of scope (deferred to later slices — noted in CHANGELOG `Next:`)
- JSON-LD (Vehicle/Offer) structured data.
- sitemap.xml entries + robots for the new family.
- price & state variants (`{model} for sale under ${X}` / `in {state}`).
- the full combo set beyond the top ~20.
- editing any scraper/ingest WIP, `AircraftSaleCard.tsx` internals, schema (no DB change).
