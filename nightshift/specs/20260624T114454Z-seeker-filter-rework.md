# Spec — Rework the "Filter Pilots" sidebar (pilot-seeking page)

**Lane:** `[want]` (last non-bug cycle `compare-pairs-expansion-4` pulled `[goal]`; alternate to `[want]`).
**Backlog item:** `[P2][want] Rework the "Filter Pilots" sidebar (pilot-seeking page)`.

## Goal
Reorder and tighten the `/partnerships/seeking` "Filter Pilots" sidebar to match how an
owner screening pilot-seekers actually thinks: lead with the aircraft they want, make the
multi-valued questions multi-select, and drop the redundant State filter.

## Scope (small, mostly front-end + one query helper)
- `src/components/SeekerFilters.tsx` — reorder + multi-select:
  1. **Lead with "Aircraft Make Wanted"** at the TOP, as a **multi-select checkbox list**
     (an owner may accept any of several makes). Comma-joined `make` URL param.
  2. **Remove the State filter** from the UI (redundant with Near Home Airport + radius).
  3. **Rating Held → multi-select** checkbox list (PPL/IFR/Commercial/CFI/ATP/Complex).
     Comma-joined `rating` URL param.
  4. Keep Near Home Airport (+ radius), Min Total Hours, Preferred Share, Clear all.
- `src/lib/seekersQuery.ts` — accept comma-joined `make`/`rating`:
  - `getSeekers`: parse `make` → array, filter with `.overlaps('preferred_makes', arr)`
    (OR semantics); same for `rating` → `.overlaps('ratings_held', arr)`. Update the mock
    branch to match. **Keep server-side `state` honoring** for backward-compatibility with
    existing saved searches / links (only the UI control is removed).
- `src/components/SeekerActiveFilterChips.tsx` — render one removable chip per selected
  make and per selected rating (was single). State chip retained for legacy links.

## Out of scope
- **No "(+ Model) Wanted" sub-filter** — `partnership_seekers` has no desired-model field,
  so a Model filter would have no backing data (would be an empty/thin control). Skipped
  honestly; noted for the backlog (would need a schema/data change first).
- No schema changes. No changes to the seeking form, cards, or partnerships browse filters.
- No restyle beyond what the reorder/multi-select requires (stays sky-blue, 375px-first).

## Acceptance criteria
1. On `/partnerships/seeking`, the sidebar order is: **Aircraft Make Wanted (multi)** →
   Near Home Airport (+radius) → Rating Held (multi) → Min Total Hours → Preferred Share.
2. **No State control** renders in the sidebar (desktop) or the mobile filter drawer.
3. Selecting two makes (e.g. Cessna + Cirrus) returns seekers wanting **either** make;
   selecting two ratings returns seekers holding **either** rating (OR, not AND).
4. Each selected make and rating shows as its own removable chip in the results header;
   removing one leaves the others applied.
5. `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) exits 0 with no
   app-origin console errors and no horizontal overflow; screenshots look correct.
6. Legacy single-value links (`?make=Cessna`, `?rating=IFR`, `?state=CA`) still work.
