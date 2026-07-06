# seeker-model-filter

## Goal
Add a Model filter to `/partnerships/seeking` (the "pilots seeking a partnership" browse page), closing the parity gap flagged by the last two CHANGELOG entries — `/partnerships` just got a Make→Model multi-select (`partnership-model-multiselect`) and `/aircraft` already has one, but the seeker browse page has no Model filter at all.

## Scope discovery (changes the plan from the backlog note)
The backlog line assumed this was "port the existing multi-select UI" (a mechanical copy). It isn't — `/partnerships`/`/aircraft` have a clean `model` column, but `partnership_seekers.preferred_models` is a single free-text string per row (e.g. `"172, 182, PA-28"`), not an array or a controlled value, and it is currently used only for display, never for filtering. So this slice adds a new filter dimension end-to-end:
1. `src/lib/seekersQuery.ts`: a pure `parsePreferredModelTokens()` helper (comma-split, trim, dedupe) to turn the free-text field into tokens; `getSeekerModels()` (mirrors `getSeekerMakes()`) to rank tokens by frequency for the filter's option list; `model` added to `SeekerFilters`/`anySeekerFilter`; the actual filtering is done in JS on the already-DB-filtered result set (case-insensitive exact-token match against selected models) rather than in SQL — this dataset is small (per a recent cycle: ~13 active seekers) and free-text `ILIKE`-based SQL matching risks both PostgREST `.or()` string-escaping bugs and substring false positives (e.g. "172" matching "172RG"); an in-memory exact-token filter is simpler, correct, and easily unit-tested.
2. `src/components/SeekerFilters.tsx`: new "Model Wanted" checkbox multi-select block (mirrors the existing Make block, reusing the already-generic `toggleMulti`), independent of the Make selection (seeker `preferred_models` isn't stored per-make, so there's no clean parent/child scoping like `/partnerships` has).
3. `src/components/SeekerActiveFilterChips.tsx`: one removable chip per selected model.
4. `src/components/MobileFiltersDrawer.tsx`: thread a new `models` prop to `SeekerFilters` for the seeker variant (mobile parity).
5. `src/app/partnerships/seeking/page.tsx`: fetch `getSeekerModels()` alongside the existing `getSeekerMakes()`/`getSeekerCount()`, pass it to `SeekerFilters` + `MobileFiltersDrawer`, add `'model'` to `activeFilterCount`'s tracked keys.

## Acceptance criteria
- `/partnerships/seeking` shows a "Model Wanted" checkbox multi-select (desktop sidebar + mobile drawer), populated from real `preferred_models` data, empty-state message when there's no data yet.
- Selecting one or more models filters results to seekers whose `preferred_models` contains a matching token (case-insensitive), via a comma-joined `model` URL param — shareable/bookmarkable like the other multi-selects.
- A removable chip renders per selected model in the results header; removing one preserves the rest.
- `activeFilterCount` (mobile filter-button badge) includes an active model filter.
- No change to `preferred_models` storage, no schema/migration, no new dependency.
- `npx tsc --noEmit` and `npx next build` both clean; new pure-function tests pass.

## Out of scope
- No change to how `preferred_models` is captured/stored on the post form (still free text).
- No scoping Model options by the currently-selected Make (data doesn't support it cleanly).
- Not wiring `model` into the `AlertSignup` source path / alert-digest matching on this page (mirrors how the existing `make`-only alert source path already works; a natural follow-on, not this slice).
- No DB-side `ILIKE`/`.overlaps` query change — filtering happens in JS on the already-fetched, already-DB-filtered rows.
