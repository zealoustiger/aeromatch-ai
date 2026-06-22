# Spec — sitemap real `lastmod` on programmatic pages

**Lane:** [goal] (last non-bug cycle `seeker-anonymous-contact` was [want]; 1:1 → [goal]).
**Item:** "[P2][goal] Sitemap `lastmod` + crawler ping" (Brainstorm 2026-06-20 §A) —
the `lastmod` half only (the crawler-ping-on-deploy half touches deploy hooks; deferred).
STAGE=INDEXING — a real, data-derived `lastmod` is a re-crawl signal for the ~250 live
programmatic URLs that currently carry no `lastModified` at all.

## Goal (one sentence)
Give every programmatic / index page in `sitemap.xml` an honest `lastModified` date derived
from when its underlying listing data last changed, so Google has a real freshness signal
instead of a missing one — without faking per-deploy churn.

## Scope (small — one file)
- `src/app/sitemap.ts` only.
- Compute two conservative "data last changed" timestamps from the live data already (or
  cheaply) queried:
  - `partnershipsLastMod` = max(`updated_at`) over **active** `partnerships`
    (computed from the rows the sitemap already fetches — **no extra query**).
  - `aircraftLastMod` = max(`last_seen_at`, `created_at`) over **active** `aircraft_for_sale`
    (two tiny `order … limit 1` queries; `aircraft_for_sale` has no `updated_at`).
- Apply them as `lastModified`:
  - Aircraft families (`/aircraft`, `/aircraft/browse`, `/aircraft/[make]`,
    `/aircraft/[make]/[model]`, `/aircraft/[make]/[model]/[state]`,
    `/aircraft/for-sale/[state]`) → `aircraftLastMod`.
  - Partnership families (`/partnerships`, `/partnerships/seeking`, `/partnerships/browse`,
    `/partnerships/state/[state]`, `/partnerships/make/[make]`,
    `/partnerships/near/[icao]`, `/airports/[icao]`) → `partnershipsLastMod`.
  - Homepage `/` → max of both (it surfaces both marketplaces).
  - Individual `/partnerships/[id]` pages → **keep** their existing per-row `updated_at`
    (already the most honest signal; unchanged).

## Acceptance criteria
- `npx next build` + `tsc --noEmit` green (no new errors in touched file).
- `/sitemap.xml` served from the production build contains `<lastmod>` on the aircraft +
  partnership family URLs and the homepage (previously absent on those), and the individual
  `/partnerships/<id>` URLs still carry their per-row date.
- The dates are real ISO dates (not "now"/build-time): re-running the build without a data
  change yields the same `lastmod`, so it's not per-deploy churn.
- Graceful degradation preserved: if Supabase is unavailable at build, the sitemap still
  ships all static + state + make URLs (just without the data-derived `lastmod`) — no crash,
  no dropped URLs vs today.
- QA smoke exit 0 on a representative page (`/aircraft`) at desktop 1280 + mobile 375
  (sitemap is metadata; this just confirms no build/runtime regression).

## Out of scope
- The crawler-ping-on-deploy half of the backlog item (touches deploy hooks).
- Per-page exact `lastmod` for aircraft make/model combos (the combos are pattern-matched via
  `countMakeModel`, so accurate in-memory grouping risks drift — a global per-family
  timestamp is the honest, low-risk slice; note per-page refinement as Next).
- Any schema/DB change, any visual/content change, any non-sitemap file.
