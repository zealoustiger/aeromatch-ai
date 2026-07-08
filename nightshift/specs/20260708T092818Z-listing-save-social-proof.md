# Real social proof: "Saved by N pilots" chip

## Goal
Show a genuine, never-fabricated "Saved by N pilots" chip on aircraft, partnership,
and seeker cards when a listing has real cross-user save engagement — the
first slice of the backlog's "Real social proof (no fabrication)" item.

## Scope
- New `src/lib/saveCounts.ts`: `getSaveCounts(ids, listingType)` — batch-fetches
  real `saved_listings` counts per listing id across ALL users (not just the
  viewer) via the existing service-role `createAdminClient()` (RLS on
  `saved_listings` is owner-scoped, so a regular client can only see its own
  saves). Only aggregate counts are read/returned — never who saved it, so no
  other user's identity is exposed. `MIN_SAVES_TO_SHOW = 2` — below that the
  signal is too thin to read as real social proof; self-suppresses instead of
  showing "Saved by 1 pilot".
- Wire into the three existing list components that already batch similar
  per-card data (comp verdicts, saved-hearts): `AircraftSaleList.tsx`,
  `PartnershipList.tsx`, `SeekerList.tsx` — one extra batched read each,
  mirroring the existing `fetchSavedAircraftIds`/saved-hearts pattern.
- New `saveCount?: number` prop + a small heart-accent chip ("Saved by N
  pilots") on `AircraftSaleCard.tsx`, `PartnershipCard.tsx`, `SeekerCard.tsx`,
  rendered in the existing badge row, only when `saveCount >= MIN_SAVES_TO_SHOW`.
- No schema change (reuses the existing `saved_listings` table exactly as-is).

## Acceptance criteria
- A listing saved by >= 2 distinct users shows "Saved by N pilots" on its card
  on `/aircraft`, `/partnerships`, and `/partnerships/seeking`.
- A listing saved by 0 or 1 user shows no chip at all (no "Saved by 1 pilot",
  no "Saved by 0 pilots" — self-suppresses cleanly).
- No new console errors; no schema/query error on pages with zero saves at all
  (today's real state for almost every listing) — the batch read fails soft.
- `npx next build` + typecheck clean.
- QA smoke (desktop 1280 + mobile 375) passes on the three affected pages.

## Out of scope
- "New today" / "Rare find — only N like this" chips (separate slices of the
  same backlog item; "New" is already covered by the existing `isNew`/"Listed
  X ago" pills).
- Showing *who* saved a listing (never — that would leak another user's
  identity/PII).
- Any change to the save/heart interaction itself (`SaveListingButton`,
  `toggleSavedListing`) — this is a read-only display addition.
