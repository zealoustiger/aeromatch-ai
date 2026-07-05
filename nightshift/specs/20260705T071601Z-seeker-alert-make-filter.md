# Seeker alert make-filtering

## Goal
Let a seeker-listing email alert be scoped to a specific make (e.g. "Cessna"), matching how aircraft/partnership alerts already carry their active filters into the digest, instead of always alerting on "any new seeker listing."

## Scope
- `src/app/api/cron/alert-digest/route.ts`
  - Add `make?: string` to the `{ type: 'seeker' }` `AlertTarget` variant.
  - Extend the query-string-aware branch (currently only `/aircraft` / `/partnerships`) to also handle `/partnerships/seeking?make=...`, parsing `make` the same way the partnership branch does.
  - Update `countNewSeekers` to accept the `seeker` target and apply `.overlaps('preferred_makes', [target.make])` when `make` is set (array column — same pattern as `getSeekers` in `src/lib/seekersQuery.ts`).
  - Update `countNew`'s dispatch to pass the target into `countNewSeekers`.
- `src/app/partnerships/seeking/page.tsx`
  - Build a filter-aware `alertSourcePath` from `params.make` (mirroring `src/app/aircraft/page.tsx`'s `alertQuery`/`alertSourcePath` pattern) and pass it — plus a `context` string when a make is active — to the inline `AlertSignup`, instead of the hardcoded bare `sourcePath="/partnerships/seeking"`.

## Out of scope
- Airport/state filtering for seeker alerts (seeker airport matching is multi-airport + radius + `additional_airports`-aware — materially more complex; left as a follow-up).
- The `/alerts` landing page's seeker chip (still a generic "any new seeker listing" chip — a curated per-make chip there is a separate, optional slice).
- Renaming the inconsistent analytics event names flagged in the prior cycle (needs a human call, unrelated to this change).

## Acceptance criteria
- `parseSourcePath('/partnerships/seeking?make=Cessna')` returns `{ type: 'seeker', make: 'Cessna' }`.
- `parseSourcePath('/partnerships/seeking')` (no query string) still returns `{ type: 'seeker' }` (make undefined) — existing bare-path alerts keep working unchanged.
- `countNewSeekers`/`countNew` only counts seekers whose `preferred_makes` overlaps the target make when one is set; counts all active new seekers (unchanged behavior) when no make is set.
- `/partnerships/seeking?make=Cessna` renders an alert signup box whose copy references "Cessna" and whose underlying `sourcePath` includes `?make=Cessna`.
- `/partnerships/seeking` with no filters still renders the existing generic alert box, unchanged.
- `npx next build` + typecheck pass; QA smoke passes on `/partnerships/seeking` and `/partnerships/seeking?make=Cessna` at desktop + mobile with zero console errors and no horizontal overflow.
