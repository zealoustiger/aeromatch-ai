# Spec: experimental-aircraft-mission

**UTC:** 2026-06-26T06:07:29Z  
**Slug:** experimental-aircraft-mission  
**Lane:** [goal] — SEO breadth: new mission landing page family member

## Goal

Add `/aircraft/mission/experimental` — a new mission landing page targeting "experimental aircraft for sale" and related high-intent searches. Expands the aircraft mission page family (currently 4 pages: glass-cockpit, ifr, tailwheel, low-time) with a 5th covering the large experimental/amateur-built segment.

## Scope

2 files:
- `src/lib/missions.ts` — add `experimental` mission entry (h1, meta, intro prose, 4 FAQs, filter)
- `src/components/AircraftChipBar.tsx` — add "Experimental" chip linking to the page

No component, schema, or query changes.

## Acceptance criteria

1. `GET /aircraft/mission/experimental` returns HTTP 200 with the experimental page content
2. Page has a unique H1 ("Experimental Aircraft for Sale"), 3-paragraph intro, and a 4-question FAQ accordion
3. FAQPage JSON-LD is emitted and matches the visible FAQ text 1:1
4. An "Experimental" chip appears in the AircraftChipBar on `/aircraft` and links to the page
5. `npx next build` exits 0 with no TypeScript errors
6. QA smoke passes: exit 0 on `/aircraft/mission/experimental` + `/aircraft` at desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero horizontal overflow)

## Out of scope

- Partnership-side experimental mission pages
- Other new mission types (twin-engine, helicopter, etc.) — one per cycle
- Database or schema changes
- Changes to the experimental mission's filter logic
