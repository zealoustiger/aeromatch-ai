# Spec — Curate the Diamond DA40 make+model page

**Slug:** `model-curate-diamond-da40`
**Lane:** `[goal]` (last non-bug cycle `seeker-filter-rework` pulled `[want]` → alternate to `[goal]`)
**Stage:** INDEXING — lift an existing, already-crawled thin page to genuine quality.

## Goal
Turn the existing **dynamically-discovered** `/aircraft/diamond/da40` page (today it
renders only a one-line generic blurb + listings) into a fully **curated** make+model
hub — real spec table, "what's different" highlights, FAQs (+ FAQPage JSON-LD), and
"About" editorial prose — by adding a Diamond DA40 entry to the curated SEO tables.

## Why this grows pageviews
- Diamond DA40 has genuine inventory (~9 active priced DA40-family listings, well over
  the thin-page floor), so the page is real, not a doorway.
- It is an **existing crawlable URL** (dynamic combo, `pattern=da40%`, `slug=da40`); the
  curated entry matches that exact `makeSlug/modelSlug/modelPattern`, so it **replaces**
  the thin page in-place — same URL, no duplicate, no sitemap churn — and upgrades it
  with unique content + structured data. That is the highest-leverage INDEXING move:
  improve quality/uniqueness of a page Google already knows about.
- Diamond is the one curated-make gap the backlog explicitly named ("extend to … diamond"),
  and it diversifies off the heavily-worked compare-pairs family (per the backlog's
  "DIVERSIFY off this family" note).

## Scope (one file)
- `src/lib/seo.ts` only:
  - Add a `{ makeSlug:'diamond', modelSlug:'da40', make:'Diamond', model:'DA40',
    modelPattern:'da40%', specs, costToOwn }` entry to `SEO_MAKE_MODELS`.
  - Add `MODEL_SPECS['diamond/da40']` (representative real figures, footnoted by the page).
  - Add `MODEL_HIGHLIGHTS['diamond/da40']` (3 differentiator bullets).
  - Add `MODEL_FAQS['diamond/da40']` (3 evergreen Q&As — match visible text 1:1 to JSON-LD).
  - Add `MODEL_OVERVIEWS['diamond/da40']` (2 evergreen narrative paragraphs).

All copy is real, well-known Diamond DA40 characteristics — no fabricated stats, no live
counts. Mirrors the existing curated-family template exactly (the page wiring already
renders all five fields conditionally).

## Acceptance criteria
- [ ] `npx next build` + typecheck pass.
- [ ] `/aircraft/diamond/da40` returns HTTP 200 and renders: key-specs table, "What's
      different about the Diamond DA40", FAQ section, "About the Diamond DA40" prose.
- [ ] The page still lists real Diamond DA40 listings (pattern unchanged → same inventory).
- [ ] FAQ visible text matches the FAQPage JSON-LD 1:1 (parity).
- [ ] No new app-origin console errors; no horizontal overflow at 1280 + 375.
- [ ] No duplicate URL created (slug/pattern identical to the prior dynamic combo).

## Out of scope
- Diamond DA42 / DA20 / DA62 curation (note as next slice).
- Any compare-pair, route, schema, or sitemap-structure changes.
- Touching other make/model families.
