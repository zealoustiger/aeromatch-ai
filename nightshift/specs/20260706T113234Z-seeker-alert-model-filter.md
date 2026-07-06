# seeker-alert-model-filter

## Tier
`[want]` (tier 2) — remaining sub-slice explicitly flagged in BACKLOG.md under the
"Model filter: roll up variants" `[P2][want]` item (line ~1086): *"Not done, intentionally:
wiring `model` into the seeker `AlertSignup` source path/alert-digest matching (mirrors how
`make`-only alert matching already works there) — a natural next slice."* Tier 1 (`[bug]`)
is empty (last cycle PASSed, no known regressions found). Other open `[want]` items audited
this cycle (Map search, collection-layout redesign, owner-leads/N-number-autofill data
collection) are either human-mock-blocked or genuinely large multi-cycle epics per repeated
prior-cycle audits (see CHANGELOG 2026-07-05/06 entries) — this is the one small, cleanly
actionable `[want]` slice available.

## Goal
When a visitor on `/partnerships/seeking` has an active `model` filter (e.g.
`?make=Cessna&model=172`), the inline email-alert box should describe and match on that
model too — today it silently drops `model` and only ever alerts on `make`, so a pilot
filtered to "Cessna 172" seekers gets alerted on ANY new Cessna seeker (182, 206, etc.),
same gap `make` had before `seeker-alert-make-filter` shipped it.

## Scope
- `src/app/partnerships/seeking/page.tsx` — extend `alertContext`/`alertSourcePath`
  computation to include `model` alongside the existing `make`.
- `src/app/api/cron/alert-digest/route.ts` — add `model?: string` to the `seeker`
  `AlertTarget` variant; parse it off the `/partnerships/seeking?...` query string branch
  in `parseSourcePath`; extend `countNewSeekers` to match it via the existing
  `matchesModelFilter`/`preferred_models` free-text logic (`src/lib/seekerModelFilter.ts`)
  the browse page already uses — no SQL column, JS-side filter same as `getSeekers()`.
- No schema change, no new UI (reuses the existing `AlertSignup` component and query-string
  contract `parseSourcePath` already expects).

## Acceptance criteria
- `/partnerships/seeking?make=Cessna&model=172` renders the inline `AlertSignup` with a
  context that names both the make and model (e.g. "Cessna 172"), not just "Cessna".
- The alert's `source_path` (what gets stored on subscribe) carries both `make` and `model`
  query params.
- `parseSourcePath` in `alert-digest/route.ts` returns a `seeker` target with `model` set
  for that query shape.
- `countNewSeekers` only counts new seeker rows whose free-text `preferred_models` contains
  the selected model token(s) (case-insensitive exact-token match, via the existing
  `matchesModelFilter` helper) when a model is present; unchanged (make-only / no-filter)
  behavior when it isn't.
- `npx next build` + typecheck pass.
- No console errors / no horizontal overflow on `/partnerships/seeking` (bare, `?make=...`,
  and `?make=...&model=...`) at 1280 + 375.

## Out of scope
- Airport/state filtering for seeker alerts (separately flagged, materially more complex —
  multi-airport + radius + `additional_airports`-aware).
- DB casing normalization for model variants (human call, flagged elsewhere).
- Any change to `/aircraft` or `/partnerships` alert matching (already correct).
