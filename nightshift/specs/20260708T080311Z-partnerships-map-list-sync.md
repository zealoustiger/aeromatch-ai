# Spec: partnerships-map-list-sync

## Goal
Clicking a pin's popup on the `/partnerships` map scrolls the page to (and briefly
highlights) that listing's card in the results list below — the first slice of the
backlog's "sidebar list ↔ map sync" (map → list direction).

## Scope
- `src/lib/mapListSync.ts` (new) — tiny shared constant + typed dispatch helper for a
  `window` CustomEvent carrying the focused listing id, mirroring the existing
  `LOCAL_SAVES_EVENT` cross-component pattern (`src/lib/localSaves.ts`).
- `src/components/PartnershipsLeafletMap.tsx` — popup gets a "↓ Show in list" button
  that dispatches the focus event with the pin's listing id (in addition to the
  existing "View listing →" link, unchanged).
- `src/components/PartnershipCard.tsx` — each card gets a stable DOM id
  (`partnership-card-{id}`), listens for the focus event, and on a matching id
  scrolls itself into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`)
  and applies a temporary highlight ring (~2s) via local state.

## Acceptance criteria
- On `/partnerships` with the map open, clicking a pin's popup "↓ Show in list"
  button scrolls the page so the matching card is in view and visibly highlighted
  (ring), then the highlight fades after ~2s.
- Clicking a different pin re-triggers the scroll/highlight for the new card.
- The existing "View listing →" popup link still works and is unchanged.
- No console errors on desktop (1280) or mobile (375); no horizontal overflow.
- No schema change, no new query, no test DB rows needed (purely client-side, reuses
  data already on the page).

## Out of scope
- The reverse direction (list card → pan/open map pin) — a natural next slice.
- "Search this area" region filter (separate backlog bullet).
- `/aircraft` map (still blocked on geocoding `aircraft_for_sale.location`).
