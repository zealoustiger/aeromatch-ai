# partnership-alert-radius-match

## Goal
Make partnership alert matching (the cron digest + the live match count on `/alerts/manage`) honor the `radius` an airport-page alert was created with, instead of silently matching only the exact ICAO — so subscribers actually get what "near KPAO" promised.

## Background
`airport-alert-cta` (shipped 2026-07-11) stores `sourcePath=/partnerships?airport=<ICAO>&radius=50` and the airport page's copy says "near KPAO." But `parseSourcePath` in both `src/app/api/cron/alert-digest/route.ts` and `src/lib/alertMatchCounts.ts` only reads `airport` into `icao` and drops `radius` entirely; every partnership match query then does `.eq('home_airport', target.icao)` — exact-ICAO only. The live `/partnerships?airport=...&radius=...` search page already solves this correctly via `getAirportsWithinRadius(icao, radiusMiles)` (`src/lib/airports.ts`, haversine over the `airports` table) — this slice reuses that existing helper in the two alert-matching code paths instead of writing new logic.

## Scope
- `src/app/api/cron/alert-digest/route.ts`:
  - Add `radius?: number` to the `partnership` variant of `AlertTarget`.
  - Parse `radius: numOrUndef(g('radius'))` in the bare-`/partnerships?...` branch of `parseSourcePath`.
  - `countNewPartnerships`, `countRecentPartnershipPriceDrops`, `fetchNewPartnershipSamples`: when `target.icao` AND `target.radius` are both set, resolve the nearby-ICAO list via `getAirportsWithinRadius` and match with `.in('home_airport', list)` instead of `.eq('home_airport', target.icao)`. No radius → unchanged exact-match behavior (backward compatible with every other partnership alert shape: bare `/partnerships`, make/state filters, `/partnerships/near/[icao]`, `/partnerships/make/...`, `/partnerships/state/...`).
- `src/lib/alertMatchCounts.ts`: identical `radius` field + parse + `countActivePartnerships` change (this file is a deliberately separate parser from the cron's, per its own header comment — keep that precedent, don't import from the cron route).
- Seeker (`/partnerships/seeking`) and `/partnerships/near/[icao]` paths are unaffected — out of scope (seekers never got a `radius` param from any shipped capture point; `near/[icao]` has no radius UI).

## Acceptance criteria
- An alert with `source_path=/partnerships?airport=KPAO&radius=50` now matches every partnership within 50 miles of KPAO in: the digest cron's new-listing count, its price-drop count, its sample cards, AND `/alerts/manage`'s live match count — not just exact `home_airport=KPAO` rows.
- An alert with `airport` but no `radius` (or `radius=0`) keeps today's exact-ICAO-only behavior, unchanged.
- Every other partnership alert shape (make-only, state-only, bare `/partnerships`, `/partnerships/near/[icao]`, make/state SEO paths) is untouched — verified by not touching those code branches.
- `next build` + typecheck pass.
- No schema change, no new capture point, no new UI.

## Out of scope
- Seeker (`/partnerships/seeking`) radius matching — no shipped capture point sets a seeker `radius` today.
- Refactoring `getAirportsWithinRadius`'s internal client (it self-constructs an anon `createServerSupabaseClient()`; both call sites run in request-scoped Next.js handlers so this works as-is — the `airports` table is public reference data).
- Any UI change to the airport page or `AlertSignup`.
