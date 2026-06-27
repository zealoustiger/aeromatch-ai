# Spec: homerails-deal-chips

**UTC:** 2026-06-27T13:12:52Z  
**Pillar:** 3 — Proprietary buyer analysis  
**Friction removed:** Buyers viewing homepage curated rails now see year+hours-controlled "Good deal" / "Priced high" chips at a glance, without navigating to browse or a detail page.

## Goal
Add the same deal verdict chips (emerald "Good deal" / amber "Priced high") to `AircraftRailCard`s on the homepage curated rails in `HomeRails.tsx` — the only remaining aircraft surface without them. The chip already renders on: listing detail page (EstimatePanel + DealScorePanel), browse cards (AircraftSaleCard), and Similar aircraft rail (SimilarAircraft). This completes the rollout.

## Scope
- **`src/components/HomeRails.tsx`** — add batch comp fetch + deal verdict computation, pass `compVerdict` to each `AircraftRailCard`. One file changed.
- `AircraftRailCard.tsx` already supports `compVerdict?: 'below' | 'above'` — no changes needed there.
- `getFamilyCompsForBatch` and `clubHangerDealVerdict` already exist — reuse them exactly as `SimilarAircraft.tsx` does.

## Acceptance criteria
1. `npx next build` exits 0 with zero TypeScript errors.
2. Homepage (`/`) loads with HTTP 200 and zero app-origin console errors.
3. `AircraftRailCard`s on the homepage curated rails display "Good deal" (emerald) or "Priced high" (amber) chips on the photo overlay for listings that meet the ≥4 similar-year/hours comps threshold.
4. Cards without sufficient comps (thin family, missing year/ttaf) show no chip — correct self-suppression.
5. No horizontal overflow at desktop 1280 or mobile 375.
6. All comp fetches run in a single `Promise.all` in parallel (one query per unique make+model family); no N+1 queries.

## Out of scope
- Changing `AircraftRailCard` component.
- Adding deal chips to partnership or seeker rails.
- Any new DB schema or columns.
- Changing the rails' listing selection logic.
