# device-saves-social-proof-parity

## Goal
Give the logged-out `/saved` view (`DeviceSavedListings`, local-device saves) the same real "Saved by N pilots" / comp-verdict / "Rare find" chips that the logged-in `/saved` page already shows, closing the last named follow-up on the `listing-save-social-proof` / `aircraft-rare-find-chip` backlog item.

## Scope
- `src/app/actions.ts` — extend `hydrateDeviceSaves` to also compute, server-side, the same real data the logged-in `/saved/page.tsx` already computes for its hydrated listings: save counts (`getSaveCounts`), aircraft comp/deal verdicts + family count (`getAircraftCompVerdicts`), partnership comp/deal verdicts (`getPartnershipCompVerdicts`), seeker budget verdicts (`getSeekerBudgetCheckVerdicts`). Return plain objects (not `Map`s) keyed by id for safe server-action serialization.
- `src/components/DeviceSavedListings.tsx` — thread the returned data into `PartnershipCard` / `AircraftSaleCard` / `SeekerCard` exactly as `/saved/page.tsx` does (`comp`, `dealVerdict`, `saveCount`, `familyCount`, `budgetVerdict`).
- No schema change, no new queries beyond what the logged-in page already runs (same helpers, same read-only functions).

## Acceptance criteria
- A logged-out visitor with ≥1 device-saved listing (aircraft, partnership, or seeker) sees the same "Saved by N pilots" chip (when ≥2 real distinct saves exist), comp/deal-verdict chip, and (aircraft) "Rare find" family chip that a signed-in user would see for the identical listing on `/saved`.
- No fabricated data: an unresolvable family / thin comp set renders no chip, mirroring the logged-in page's self-suppress behavior exactly (reuses the identical helpers).
- No behavior change for listings with 0/1 saves or no resolvable comps — same self-suppress as today.
- Un-saving a card (heart toggle) still works exactly as before (no regression to the existing prune-on-`LOCAL_SAVES_EVENT` logic).
- `npx next build` + typecheck pass; QA smoke on `/saved` (logged-out) at desktop 1280 + mobile 375, zero console errors, zero horizontal overflow.
- Visual cycle — screenshots read and confirmed to look correct (chips render, no layout regression).

## Out of scope
- `AircraftRailCard` (compact rail cards) family-count wiring — separate follow-up, different component with no free badge slot.
- Any change to the logged-in `/saved/page.tsx` (already correct) or to the underlying comp/save-count helpers themselves.
- `SavedListingNote` (notes) — untouched, logged-out view never had notes.
