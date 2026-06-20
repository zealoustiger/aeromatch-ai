# aircraft-alerts-capture

## Goal
Add the proven inline `AlertSignup` email-capture to the #1-traffic marketplace page `/aircraft` (18 views/7d) with a **filter-aware context** so each captured alert describes the exact search the visitor is looking at (e.g. "Cessna 172 in California under $50,000"), falling back to a generic "new aircraft for sale" when no filters are active.

## Scope (small)
- `src/lib/seo.ts` (or a small new pure helper) — add `describeAircraftFilters(params)` that turns the active for-sale searchParams into a human-readable phrase. Reuses `STATE_NAMES`. No new dependency.
- `src/app/aircraft/page.tsx` — import `AlertSignup`, build `context` from the helper, build `sourcePath` from `/aircraft` + the active query string, render it tastefully below the results / above the "by state" block (consistent with the for-sale state page placement).

## Acceptance criteria
- `AlertSignup` renders on `/aircraft` (desktop 1280 + mobile 375), inline, sky-blue accent, single email field, no modal, no fake urgency.
- With active filters (e.g. `?make=Cessna`), the served HTML's context mentions the filter (e.g. "Cessna"); a richer combo like `?make=Cessna&model=172&state=CA&max_price=50000` reads as a natural phrase ("Cessna 172 in California under $50,000").
- With no filters, the context falls back to a generic phrase ("new aircraft for sale").
- `sourcePath` reflects `/aircraft` and preserves the active query string (so the captured alert is reproducible) — additive over the static-path convention used by the route-based pages, justified because `/aircraft` carries its filters in the query string.
- `npx next build` + `npx tsc --noEmit` pass (only the 3 pre-existing `.test.ts` baseline errors allowed; no NEW errors in touched files).
- No console/hydration errors; no horizontal overflow at 375px.
- A real submit shows the success state (writes one test row to the shared additive `alerts` table — acceptable/idempotent, same as slice 1 QA).

## Out of scope
- No schema/DB change, no SQL (the `alerts` table already exists).
- No change to `AlertSignup.tsx` or the `subscribeToAlerts` action (reuse as-is).
- No change to filtering/query logic, ranking, or any frozen file (auth/admin/ingest/env).
- No transactional-email infra (capture only, same as the live slices).
