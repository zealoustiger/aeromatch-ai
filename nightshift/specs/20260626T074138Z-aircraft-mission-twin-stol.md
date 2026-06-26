# Spec: aircraft-mission-twin-stol

**UTC:** 2026-06-26T074138Z  
**Slug:** aircraft-mission-twin-stol

## Goal
Add two new curated mission landing pages to the `/aircraft/mission/[mission]` family:
- `/aircraft/mission/twin-engine` — targets "twin engine aircraft for sale" (high search volume)
- `/aircraft/mission/stol` — targets "STOL aircraft for sale" and "short takeoff aircraft for sale"

Both pages carry unique editorial guidance + a live grid of real matching listings + FAQPage JSON-LD. They extend the existing pattern in `src/lib/missions.ts` with no new route code needed — the `[mission]` route already reads from that registry. Two chips added to `AircraftChipBar.tsx` for internal linking from the high-traffic `/aircraft` hub.

## Scope
- `src/lib/missions.ts` — add two `Mission` entries (twin-engine, stol) to `MISSIONS[]`
- `src/components/AircraftChipBar.tsx` — add two `MissionChip` entries to `MISSION_CHIPS[]`

## Acceptance criteria
1. `/aircraft/mission/twin-engine` returns HTTP 200 at desktop 1280 + mobile 375
2. `/aircraft/mission/stol` returns HTTP 200 at desktop 1280 + mobile 375
3. Each page has a unique H1, 2-3 intro paragraphs, and a 4-question FAQ accordion
4. FAQPage JSON-LD is emitted on each page (verifiable via curl)
5. Zero app-origin console errors, zero horizontal overflow on both pages at both viewports
6. `/aircraft` hub shows the two new chips in AircraftChipBar (visual check)
7. `npx next build` exits 0 (no TS errors)

## Out of scope
- New route code (the existing `[mission]` route handles it)
- Database changes
- New page families beyond these two missions
- Deep-linking the chips to external filters (they link to the mission pages, same as existing chips)
