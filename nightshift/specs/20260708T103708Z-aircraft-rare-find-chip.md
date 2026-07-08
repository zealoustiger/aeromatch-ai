# aircraft-rare-find-chip

## Goal
Add the two remaining honest "real social proof" signals from the backlog's
"Real social proof (no fabrication)" item — a "New today" refinement to the
existing New badge, and a new "Rare find — only N like this" chip on
`/aircraft` browse cards — using only real, already-computed data.

## Scope
- `src/components/AircraftSaleCard.tsx`: split the existing 7-day `isNew`
  freshness check into two tiers — keep "New" for the 7-day window, but label
  it "New today" specifically when `first_seen_at` is within the last 24h
  (same data, no new query). Add a new `familyCount` prop and a "Rare find —
  only N like this" chip (Gem icon, indigo accent) that renders only when
  `familyCount` is a real, resolved count between 1 and `RARE_FIND_MAX` (3)
  inclusive — never on `null`/`0` (0 is treated as "can't confirm" to avoid a
  self-contradictory "0 like this" on a listing that itself exists).
- `src/components/AircraftSaleList.tsx`: pass `familyCount` into
  `AircraftSaleCard` from the family comp map (`allFamilyComps.length`,
  already computed per-card for the Deal Check verdict) — no new DB query.
  Only wired on the main `/aircraft` browse list this cycle.

## Acceptance criteria
- A listing first seen <24h ago shows "New today"; 1–7 days shows "New";
  ≥7 days shows neither — verified against real `first_seen_at` timestamps.
- A listing in a small curated family (family comp count 1–3, e.g. a rare
  type like the Bellanca Citabria or Grumman AA-1) shows "Rare find — only N
  like this"; a common family (e.g. Cessna 172) does not.
- The chip never renders when the family can't be resolved (non-curated
  make/model) or when the family map query fails (fail-soft to no chip, same
  convention as `CompPill`/`getSaveCounts`).
- `npx next build` + `tsc --noEmit` clean.
- No schema/DB/dependency change — pure read of data already fetched.
- `/aircraft` renders correctly at desktop 1280 + mobile 375, zero console
  errors, zero horizontal overflow.

## Out of scope
- Wiring `familyCount` into other `AircraftSaleCard` call sites (`/saved`,
  `/aircraft/deals`, rail cards, the listing detail page's own card) — a
  natural follow-up slice, left for later so this cycle stays scoped to the
  primary browse surface.
- Partnership/seeker card parity (mirrors the earlier `listing-save-social-proof`
  precedent of shipping aircraft first, then porting).
