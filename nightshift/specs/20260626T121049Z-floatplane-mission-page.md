# Spec: floatplane-mission-page

**Timestamp:** 20260626T121049Z  
**Slug:** floatplane-mission-page  
**Lane:** [goal] — SEO breadth, STAGE=INDEXING

## Goal
Add a "Floatplane & Amphib Aircraft for Sale" mission landing page at
`/aircraft/mission/floatplane` — the 9th member of the curated mission family —
targeting "floatplane for sale", "seaplane for sale", and "amphibious aircraft for
sale" buyer queries; and add a "Floatplane" chip to `AircraftChipBar` on `/aircraft`
for an internal link from the hub.

## Scope
- `src/lib/missions.ts` — add `floatplane` mission entry with H1, meta, 3-para
  intro, and 4-question FAQ/FAQPage JSON-LD
- `src/components/AircraftChipBar.tsx` — add Floatplane chip (same pattern as the
  7 existing mission chips: Turboprop, STOL, Twin-engine, etc.)

**Filter:** `{ q: 'float' }` — "float" matches "on floats", "floatplane",
"float plane", "amphibious" *may not* match on q but amphib aircraft descriptions
commonly include "float" in the equipment context; the honest-empty-state pattern
handles zero results gracefully.

## Acceptance criteria
1. `GET /aircraft/mission/floatplane` returns HTTP 200.
2. Page has H1 "Floatplane & Amphib Aircraft for Sale" and a breadcrumb trail
   (`Home > Aircraft for Sale > Mission > Floatplane`).
3. Page renders 3 paragraphs of unique editorial intro and a 4-question FAQ
   accordion — all content specific to floatplanes/amphib (not generic).
4. `<script type="application/ld+json">` on the page contains a valid FAQPage
   entity with 4 Question entries matching the visible FAQs 1:1.
5. `/aircraft` renders without errors and includes a "Floatplane" chip in the
   chip bar.
6. `npx next build` exits 0 with no TypeScript errors.
7. QA smoke exits 0 on `/aircraft/mission/floatplane` + `/aircraft` at desktop
   1280 and mobile 375 (HTTP 200, zero app-origin console errors, zero
   horizontal overflow).

## Out of scope
- New DB columns, schema changes, or new query logic.
- Any changes to the compare-pages family.
- Any new sitemap.ts edits (the `/aircraft/mission/[mission]` dynamic route is
  already emitted via the MISSIONS array).
