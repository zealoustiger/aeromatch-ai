# Spec — Partnership filter: multiple airport codes

**Lane:** `[want]` (P2). Last non-bug cycle (`browse-compare-mission-links`) pulled `[goal]`,
last cycle PASS → no blocker → `[want]` owed per the 1:1. Scoreboard STAGE=INDEXING,
pageviews 7d=325.

## Goal
Let users filter `/partnerships` by **multiple home airports** (e.g. KHWD, KOAK, KCCR),
OR'd together, with one removable chip per airport — instead of the single-airport-only
text input today.

## Why this is the right small slice
The query layer **already supports** a multi-airport `airports` param
(`resolveAirportList` → `.in('home_airport', [...])` in `partnershipsQuery.ts`), the
results-header copy already renders `near KHWD, KOAK` for a list, but the **filter UI only
exposes a single `airport` input**. So this is purely a front-end slice: expose the
existing capability. Additive, no schema, low risk.

## Scope (files expected to touch)
- `src/components/PartnershipFilters.tsx` — replace the single Home-Airport text input
  with a multi-code chip input: type a code + Enter/comma/space (or blur) to add a chip,
  chips shown below the input, each removable. Writes the comma-joined `airports` param
  and clears the legacy `airport`/`radius` params on edit (consolidation). Seeds its
  initial chips from `airports`, falling back to a lone legacy `airport` for back-compat.
- `src/components/PartnershipActiveFilterChips.tsx` — render one removable results-header
  chip per code in `airports` (each removal rewrites `airports` minus that code); keep the
  existing single `airport`+radius chip only when no `airports` is present (back-compat).

## Acceptance criteria
- [ ] On `/partnerships`, the Home Airport filter accepts **multiple** ICAO codes; adding
      a code shows a removable chip in the filter panel and updates results.
- [ ] Multiple airports are **OR'd** (listings at any of the entered airports show), via the
      existing `airports` param + `.in()` query path.
- [ ] Each active airport renders **one removable chip** in the results-header
      (`PartnershipActiveFilterChips`); removing a chip drops just that airport.
- [ ] A legacy single `?airport=KHWD` URL still works (chip + results) — back-compat preserved.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200, no app console errors, no
      horizontal overflow) passes at 1280 + 375 on `/partnerships` and
      `/partnerships?airports=KHWD,KOAK`.

## Out of scope
- The seeking browse / seeker filter (`/partnerships/seeking`) — separate item.
- The for-sale (`/aircraft`) airport+radius filter (separate backlog item).
- Radius-by-airport changes — the legacy single `airport`+`radius` path is left intact.
- Any schema / query-layer change (query already supports `airports`).
