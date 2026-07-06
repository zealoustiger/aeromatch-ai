# aircraft-trust-ranking

## Goal
Extend the existing "completeness-weighted ranking" (shipped 2026-06-20 for `/partnerships` as
`trust-ranking`, using `evaluateTrust`/`sortByTrust`) to `/aircraft` — the one browse surface that
still lacks it — so complete, honest listings surface above thin ones under the default sort.

## Scope
- `src/components/AircraftSaleList.tsx` — `fetchAircraftPage`: after the default-sort query path
  returns its page of rows, apply the same pattern as `partnershipsQuery.ts`'s `sortByTrust`
  (stable sort by `evaluateAircraftTrust(p).score` DESC, original-index tie-break) using the
  already-existing `evaluateAircraftTrust` from `src/lib/aircraftTrust.ts`. No new function needed
  in a shared lib — a small local helper mirroring `sortByTrust` is enough (same shape as the
  precedent, which also lives next to its query, not in a shared util).
- Applies ONLY to the default sort branch (no `?sort=` or an unrecognized value, i.e. the `switch`
  `default:` case that already orders by `created_at desc`). Distance sort (RPC path) and the three
  explicit sorts (`price_asc`, `price_desc`, `reduced`) are untouched.

## Acceptance criteria
- Default `/aircraft` (no `?sort=`) reorders its 60-row page by trust score (0-4) descending,
  original recency order preserved as the tie-break — mirrors `/partnerships`' existing behavior.
- `/aircraft?sort=price_asc`, `?sort=price_desc`, `?sort=reduced` render in exactly their current
  order (byte-identical listing order to before this change) — verified by diffing served HTML.
- `/aircraft?sort=distance` (with a resolvable center) is untouched — RPC path returns before the
  new sort code runs.
- No schema/DB change; `evaluateAircraftTrust` reused unmodified, no new column/table.
- `npx next build` + typecheck clean; qa-smoke passes on `/aircraft`, `/aircraft?sort=price_asc`,
  `/aircraft?make=Cirrus` (default sort with a filter) at desktop 1280 + mobile 375.

## Out of scope
- `/partnerships/seeking` (seeker trust ranking) — separate next slice, needs its own approach per
  research (no code change here).
- `quality_score` / A-B-C grade filter — untouched, orthogonal system.
- Pagination, avionics filter, drops filter — untouched aside from inheriting the reorder when they
  fall into the default-sort branch (same as today).
