# Deal Check: accept SMOH as a fallback hours signal when TTAF is missing

## Goal
Widen ClubHanger Deal Check coverage by letting `clubHangerDealVerdict` use SMOH
(hours since major overhaul) as the "similar hours" signal when a listing has no
TTAF (total airframe time), instead of silently publishing no verdict at all —
without ever mixing TTAF and SMOH values in the same comparison (that would be
apples-to-oranges and violate the honesty gate).

## Scope
- `src/lib/aircraftEstimate.ts` — `clubHangerDealVerdict`: add optional `smoh` to
  `DealSubject`/`DealComp`; when the subject has no valid `ttaf`, fall back to
  `smoh` as the hours signal, and narrow comps using ONLY the same-type field
  (SMOH-to-SMOH), never comparing a SMOH subject against a comp's TTAF or vice
  versa. Add `hoursSignal: 'ttaf' | 'smoh'` to the returned verdict so callers can
  render honest copy about which basis was used.
- `src/lib/aircraftForSale.ts` — `getFamilyComps` / `getFamilyCompsForBatch`: add
  `smoh` to the select + return shape (read-only, no schema change — `smoh` is an
  existing column).
- `src/lib/aircraftComps.ts` — `getAircraftCompVerdicts`: add `smoh` to its own
  comp select + `AircraftCompSubject`/`CompRow`, pass through to the verdict call.
- `src/components/AircraftSaleList.tsx`, `HomeRails.tsx`, `SimilarAircraft.tsx` —
  thread `smoh` through their local comp types and `clubHangerDealVerdict` calls
  (subject listings already carry `smoh` via `select('*')`/`AircraftForSale`).
- `src/app/aircraft/listing/[id]/page.tsx` — pass `p.smoh` as the subject; update
  the Deal Check copy (`DealCheck`, `computeDealSignals`'s "Good deal"/"Fair
  price"/"Priced high" rows) to say "similar-year, similar engine-time" instead of
  "similar-year, similar-hours"/"comparable total time" when `hoursSignal ===
  'smoh'`, so the claim stays honest about which basis was used.
- Unit tests in `aircraftEstimate.test.ts` covering the SMOH fallback (used only
  when TTAF absent; never cross-compared with a comp's TTAF-only row; still
  requires MIN_DEAL_COMPS).

## Acceptance criteria
- A subject with `ttaf: null` but a valid `smoh` and >= 4 same-year comps that
  also have valid `smoh` gets a real Deal Check verdict (previously: null).
- A subject with `smoh` set is NEVER compared against a comp that only has
  `ttaf` (no `smoh`) — that comp is excluded from the narrowed set.
- A subject with a valid `ttaf` behaves byte-identically to before (no change to
  existing TTAF-based verdicts / existing unit tests, since `smoh` fallback only
  triggers on missing/invalid `ttaf`).
- The Deal Check UI on `/aircraft/listing/[id]` reads "similar engine-time" (not
  "similar-hours"/"total time") when the verdict was computed from SMOH.
- `next build` + `tsc --noEmit` clean; existing unit test suite passes unchanged
  plus new SMOH-fallback tests.
- No schema change (both `ttaf` and `smoh` are existing columns).

## Out of scope
- The whole-family descriptive `clubHangerEstimate` (unaffected — price-only).
- `computeEngineLife`/`computeAirframeUsage` (already correctly SMOH-only /
  TTAF-only respectively — this cycle only touches the Deal Check hours-band).
- Backfilling a hoursSignal-aware label on `AircraftRailCard`'s simple
  below/above chip (no detail text there today to update).
