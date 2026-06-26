# Spec: Airport ICAO filter for aircraft for-sale browse

**Timestamp:** 20260626T123244Z  
**Slug:** similar-aircraft-detail (branch/screenshot name; feature = aircraft airport filter)  
**Lane:** [want] — P2 filter: airport ICAO + distance radius (for-sale), slice 1

## Goal
Add a "Near airport (ICAO)" filter to the `/aircraft` browse page, so buyers can filter aircraft by airport — e.g. "show me aircraft based near KSFO". Server-side: ICAO → state lookup; applies `.eq('state', resolvedState)`.

## Scope
Files touched:
- `src/components/AircraftSaleList.tsx` — add `airport?: string` to `Filters`; resolve ICAO→state in `fetchAircraftPage`
- `src/components/AircraftSaleFilters.tsx` — add "Near airport (ICAO)" text input in "More filters"; add `airport` to `SECONDARY_KEYS`
- `src/components/ActiveFilterChips.tsx` — add "Near KSFO" removable chip

## Acceptance criteria
1. A "Near airport (ICAO)" text input appears in the "More filters" section on `/aircraft`.
2. Typing an ICAO code (e.g. KSFO) and pressing Enter or blurring updates `?airport=KSFO` in the URL.
3. The `/aircraft` listing results are filtered to the state that airport is in (KSFO → CA → California listings only).
4. An active "Near KSFO" chip appears above the results when the filter is active; clicking X removes it.
5. "More filters" auto-expands when an airport filter is already active (e.g. on page load from a saved search URL).
6. If the ICAO code isn't in our airports table, the filter falls back gracefully (shows all listings, no crash).
7. Build + typecheck pass; smoke exit 0 on `/aircraft` and `/aircraft?airport=KSFO` at desktop 1280 + mobile 375.

## Out of scope
- Distance radius (within X miles) — needs per-listing geocoding; this slice = state-level only
- Real geocoding of `aircraft_for_sale.location` field (future slice)
- Airport auto-complete / validation UI
- Seeking filter multi-airport (separate item)
