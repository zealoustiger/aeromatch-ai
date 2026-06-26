# Spec: aerobatic-mission-page

**UTC timestamp:** 20260626T130813Z  
**Slug:** aerobatic-mission-page  
**Lane:** [goal] — SEO breadth (last 3 non-bug cycles all [want], so [goal] owed per 3:1 policy)

## Goal
Add an "Aerobatic Aircraft for Sale" mission landing page at `/aircraft/mission/aerobatic` targeting the real buyer queries "aerobatic aircraft for sale", "Pitts Special for sale", "Extra 300 for sale", and "aerobatic plane for sale". This is the 10th entry in the proven curated mission page family and the next explicitly requested addition (floatplane CHANGELOG "Next" note).

## Scope
- `src/lib/missions.ts` — append a new aerobatic entry to `MISSIONS[]`
- `src/components/AircraftChipBar.tsx` — add an "Aerobatic" chip linking to `/aircraft/mission/aerobatic`

## Acceptance criteria
1. `GET /aircraft/mission/aerobatic` returns HTTP 200
2. Page renders a unique H1 "Aerobatic Aircraft for Sale"
3. Three editorial intro paragraphs covering: (a) what aerobatic aircraft and certification are; (b) training/ratings and IAC; (c) pre-purchase inspection considerations
4. FAQPage JSON-LD present and 4 Q&As match the visible accordion 1:1
5. "Aerobatic" chip appears in `AircraftChipBar` on `/aircraft`
6. `npx next build` exits 0 with no TypeScript errors
7. QA smoke passes on `/aircraft/mission/aerobatic` + `/aircraft` at desktop 1280 + mobile 375 (HTTP 200 / no app-origin console errors / no horizontal overflow)

## Out of scope
- New make/model pages for Pitts, Extra, etc.
- Changes to existing mission pages
- Any DB query changes (live listing grid reuses existing `fetchAircraftPage` with `q=aerobatic`)
- Training-resource links to external schools
