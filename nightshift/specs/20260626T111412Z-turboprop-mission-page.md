# Spec: turboprop-mission-page

**UTC:** 2026-06-26T111412Z
**Lane:** [goal] — SEO breadth (3 consecutive [want] cycles → [goal] owed per 3:1 policy)

## Goal
Add a curated `/aircraft/mission/turboprop` landing page targeting "turboprop aircraft for sale" and "turbine aircraft for sale" — a genuinely high-intent buyer query for the turboprop segment (TBM, Pilatus PC-12, King Air, Piper Cheyenne) — with unique editorial guidance, FAQPage JSON-LD, real live listings, and an internal chip link from `/aircraft`.

## Scope
- `src/lib/missions.ts` — add a `turboprop` mission entry (slug, h1, metaTitle, metaDescription, blurb, intro×3, faqs×4, filters)
- `src/components/AircraftChipBar.tsx` — add a "Turboprop" chip linking to `/aircraft/mission/turboprop`

That is 2 files. No new routes (the existing `/aircraft/mission/[mission]` dynamic route picks it up automatically). No schema changes.

## Acceptance criteria
1. GET `/aircraft/mission/turboprop` returns HTTP 200 at desktop 1280 and mobile 375 with no app-origin console errors and no horizontal overflow.
2. Page has a unique H1 ("Turboprop Aircraft for Sale") and intro prose that is distinct from other mission pages — explains what turboprops are, who buys them, what to check (engine PT6/TPE331/Walter conditions, hot-section inspection, time since overhaul, prop condition).
3. A 4-question FAQ accordion is visible and the FAQPage JSON-LD emitted in the `<head>` matches it 1:1 (verified via curl).
4. The live listing grid shows real aircraft from the DB (turboprop keyword filter).
5. A "Turboprop" chip appears in the `AircraftChipBar` on `/aircraft` and links to `/aircraft/mission/turboprop`.
6. `npx next build` exits 0 with no TypeScript errors.

## Out of scope
- New route files (existing dynamic [mission] page handles this)
- Schema changes
- Other new mission pages (amphibian, aerobatic — separate cycles)
- Any DB/inventory changes
