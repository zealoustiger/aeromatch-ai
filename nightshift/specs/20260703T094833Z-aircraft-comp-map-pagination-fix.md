# aircraft-comp-map-pagination-fix

## Goal
Fix a silent accuracy bug in the sitewide aircraft "vs market" comp pill / Deal Check
verdict: the family price/comp maps are built from an unscoped PostgREST query that is
silently capped at 1000 rows, so dense makes are computed from an incomplete sample —
directly undermining the Pillar 3 honesty guardrail ("analysis must be honest/data-grounded").

## Background (found + verified this cycle)
The prior cycle (`saved-aircraft-comp-verdict`) flagged: "PostgREST silently caps unscoped
result sets at 1000 rows regardless of the `.limit(5000)` requested — the DB actually has
2121 active priced aircraft listings... for any make dense enough to be underrepresented in
that capped sample." Verified directly against the live DB this cycle (read-only, service
role, no writes): `select(...).eq('status','active').gte('asking_price',50000).limit(5000)`
returns exactly 1000 rows while `count: 'exact'` reports 2121 matching rows. Manually
paginating the same query with `.range()` in batches of 1000 returns all 2121 rows.

## Scope
- `src/components/AircraftSaleList.tsx`: `fetchFamilyPriceMap()` and `fetchFamilyCompMap()`
  — replace the single `.limit(5000)` call with a `.range()` pagination loop (batch 1000)
  so the full active+priced population is read, not just the first 1000 rows.
- Add a small shared pagination helper (local to this file) to avoid duplicating the loop
  across the two functions.
- No change to callers (`AircraftSaleList` default export, `fetchUnderMarketDeals`) — they
  already consume the returned `Map` the same way; only the completeness of the map changes.
- No schema change, no new query shape, no behavior change to any other file.

## Out of scope
- `fetchUnderMarketDeals`'s own separate `.limit(2000)` candidate-scan query (a different,
  not-yet-confirmed instance of the same class of bug) — flagged in "Next" for a future cycle,
  not fixed here to keep this change small and reviewable.
- Any change to the comp/verdict math itself (`compVsMarket`, `clubHangerDealVerdict`) — pure
  data-completeness fix, not a formula change.

## Acceptance criteria
- [ ] `fetchFamilyPriceMap()` and `fetchFamilyCompMap()` fetch ALL matching rows (verified
      against the live DB: 2121 rows, not 1000) via pagination, not a single capped `.limit()`.
- [ ] `npx next build` + `tsc --noEmit` both pass with zero errors.
- [ ] QA smoke passes on `/aircraft` (and `/aircraft/deals` if it exists) at desktop 1280 +
      mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- [ ] Non-visual cycle (pure data-completeness fix, no UI/CSS change) — screenshots saved for
      the audit trail but not required reading for PASS; smoke gate is sufficient.
- [ ] Direct DB verification: re-run the pagination check against a fresh Supabase query to
      confirm row count now matches `count: 'exact'` (2121 or whatever the live count is at
      verification time).
