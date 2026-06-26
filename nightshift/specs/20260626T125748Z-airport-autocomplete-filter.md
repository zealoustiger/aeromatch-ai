# Spec: airport-autocomplete-filter

**UTC**: 2026-06-26T12:57:48Z  
**Lane**: [want] — last 3 non-bug cycles: [want], [want], [goal] → [want] owed per 3:1 policy.

## Goal
Replace the plain "4-letter ICAO code" text inputs on the `/aircraft` and `/partnerships` browse filters with a smart airport autocomplete that accepts city names, airport names, and ICAO/IATA codes — so buyers don't need to memorize codes like "KSFO" when they know "San Francisco."

## Scope
Files to touch:
1. `src/components/AirportAutocompleteInput.tsx` — **new** reusable client component (debounced Supabase lookup, suggestions dropdown, keyboard nav, emits selected ICAO string). Pattern drawn from `HeroSearch.tsx`.
2. `src/components/AircraftSaleFilters.tsx` — replace the plain `<input type="text" … onBlur>` airport field with `<AirportAutocompleteInput>`.
3. `src/components/PartnershipFilters.tsx` — replace the plain `<input>` airport text field (used for the add-airport chip step) with `<AirportAutocompleteInput>`.

## Acceptance criteria
1. On `/aircraft`, typing "Oakland" into the airport filter shows autocomplete suggestions including "KOAK — Oakland, CA"; picking it sets the filter to `KOAK` and shows aircraft in California.
2. On `/aircraft`, typing "SFO" shows "KSFO — San Francisco, CA" (IATA prefix match); picking it sets `KSFO`.
3. On `/partnerships`, the add-airport chip input shows the same autocomplete when typing a city/code; picking a suggestion adds its ICAO chip (same behavior as typing the ICAO and pressing Enter, but without needing to know the code).
4. Typing a known 4-letter ICAO (e.g. "KHWD") still works — existing behavior preserved.
5. Typing something with no matches shows no dropdown (no broken UI, no error).
6. Escape key closes the suggestion list without committing.
7. No horizontal overflow at 375px mobile; dropdown doesn't clip outside the viewport.
8. No app-origin console errors on either page.

## Out of scope
- Radius filter ("within X mi") — deferred until aircraft listing geocoding exists.
- Autocomplete on the seeker form posting page (a future cycle).
- Heliports, seaplane bases, closed airports are filtered out (same as HeroSearch).
