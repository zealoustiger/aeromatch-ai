# seeker-model-filter-make-scoped

## Goal
Scope the `/partnerships/seeking` "Model Wanted" filter's option list to only the model
tokens mentioned by seekers who also want one of the currently-selected Make(s), instead
of always showing every model token across all active seekers.

## Scope
- `src/lib/seekersQuery.ts` — `getSeekerModels()` gains an optional `makes?: string[]`
  param; when provided, narrows the row pool via `.overlaps('preferred_makes', makes)`
  (mirrors the same filter already used in `getSeekers`) before tokenizing
  `preferred_models`. Mock-data (`!hasSupabase()`) path filters `MOCK_SEEKERS` the same way.
- `src/app/partnerships/seeking/page.tsx` — parse the active `make` query param (comma-
  joined, same convention as `SeekerFilters`) and pass it into `getSeekerModels(makes)`.
- `src/components/SeekerFilters.tsx` — update the stale comment ("not scoped by the
  selected make — the two fields aren't linked in the data") to reflect the new behavior.
  No prop/behavior change needed beyond the narrower `models` list already being passed in.

## Acceptance criteria
- With no `make` filter active, the Model Wanted list is unchanged (every token across all
  active seekers) — verified against live data.
- With a `make` filter active (e.g. `?make=Cessna`), the Model Wanted list only shows model
  tokens parsed from seekers whose `preferred_makes` overlaps the selected make(s) —
  verified against live data with a real make that narrows the count.
- Selecting multiple makes ORs them (matches `getSeekers`' existing `.overlaps` semantics).
- No schema change, no new query round-trip beyond the existing `getSeekerModels` call
  (same call site, just an added filter param).
- `npx tsc --noEmit` and `npx next build` stay clean.
- `/partnerships/seeking` (with and without a `make` filter) passes the QA smoke gate at
  desktop 1280 + mobile 375 with zero console errors / zero horizontal overflow.

## Out of scope
- Any change to `getSeekers()`'s actual filtering/matching logic (already correct).
- DB casing normalization of stored make/model values (separate, human-flagged item).
- Any change to the aircraft/partnership (non-seeker) model filters.
- Linking specific model tokens to specific makes within a single seeker row (the free-text
  `preferred_models` field still isn't per-make; this only narrows the candidate *pool* of
  rows before tokenizing, which is the same level of precision `getSeekers`' own `.overlaps`
  narrowing uses).
