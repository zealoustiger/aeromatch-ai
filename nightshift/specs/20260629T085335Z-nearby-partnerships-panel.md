# Spec: nearby-partnerships-panel

**UTC timestamp:** 20260629T085335Z  
**Pillar:** Buyer analysis (Pillar 3) — proprietary competitive context on the partnership detail page

## Goal
When viewing a partnership listing, show buyers how many other active partnerships are within 100 nautical miles of that airport — proprietary competitive context no listing site offers. A buyer who sees "4 other partnerships near KPAO" immediately knows their options; a buyer who sees nothing knows this is rare.

## Scope
Files expected to touch:
- `src/lib/nearbyPartnerships.ts` — add lightweight `countNearbyPartnerships(icao, excludeId)` function
- `src/app/partnerships/[id]/page.tsx` — call it + render sidebar panel

## Acceptance criteria
1. A new sidebar panel ("Also near [AIRPORT]") appears below `PartnerShareCostPanel` on the partnership detail page.
2. Panel shows: "N other active partnerships within 100 nautical miles of [City, State]" (or "[ICAO]" when city is unknown).
3. Panel includes a "Browse all nearby →" link to the existing `/partnerships/near/[icao]` route (already gated to ≥2 real listings).
4. Panel self-suppresses when count = 0 (this is the only option nearby) or when the airport can't be resolved.
5. The count excludes the current listing (no "1 partnership near KPAO" when viewing that same one).
6. No new DB schema. Build passes clean. Smoke gate passes on partnership detail paths.

## Out of scope
- Changing the `/partnerships/near/[icao]` page itself
- Showing individual nearby partnership cards in the sidebar (count + link is sufficient for this slice)
- Distance-ranked list or map
