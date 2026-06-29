# Spec: seeker-airport-or-filter

**UTC:** 20260629T081526Z  
**Pillar:** Frictionless listing posting (Pillar 1)

## Goal

When an owner (or buyer) browses seekers filtered by airport, also surface seekers who
listed that airport as their second home airport (`additional_airports`), not only those
whose primary `home_airport` matches.

## Background

The `seeker-additional-airports` cycle (2026-06-29T075453Z) added an optional
"Also flying from" field on the seeker post form, stored as `additional_airports text[]`.
But `getSeekers()` in `src/lib/seekersQuery.ts` still filters with:

    query = query.in('home_airport', airportIcaos)

A seeker who lists KPAO as primary and KNUQ as secondary is invisible to an owner
searching for seekers at KNUQ. This cycle fixes that.

## Scope

- **`src/lib/seekersQuery.ts`** — the only file that needs to change.
  - Supabase query path: replace `.in('home_airport', airportIcaos)` with an OR filter
    that checks both `home_airport` IN the list AND `additional_airports` overlapping the
    list (PostgREST `.or()` syntax).
  - Mock data path: extend the in-memory filter to also check `additional_airports`.
  - Graceful fallback: if the `additional_airports` column hasn't been migrated yet,
    the query will error; detect via `error.message.includes('additional_airports')` and
    retry with `home_airport`-only (same pattern as `createSeekerListing`).

## Acceptance criteria

1. A seeker with `home_airport='KPAO'` and `additional_airports=['KNUQ']` is returned
   by `getSeekers({ airports: 'KNUQ' })` (not just `{ airports: 'KPAO' }`).
2. A seeker with only `home_airport='KPAO'` (no `additional_airports`) is still returned
   by `getSeekers({ airports: 'KPAO' })` and NOT by `{ airports: 'KNUQ' }`.
3. Seekers with no airport filter (state-based or no filter) are unaffected.
4. All filters (makes, ratings, share_type, min_hours) continue to apply alongside the
   expanded airport filter.
5. If `additional_airports` column doesn't exist (pre-migration), the function falls back
   to `home_airport`-only filter and returns correct results (no crash, no empty list).
6. `npx next build` + `tsc --noEmit` pass; smoke on `/partnerships/seeking` exits 0.

## Out of scope

- UI changes — no form, card, or layout changes this cycle.
- The radius expansion (`resolveSeekerAirports`) — radius already expands `home_airport`;
  we expand that same resolved list to also cover `additional_airports`.
- Changing `getSeekerCount()` (it doesn't filter by airport, so unaffected).
- Changing `getSeekerMakes()` (no airport filter, unaffected).
