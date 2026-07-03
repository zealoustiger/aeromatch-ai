# Spec: near-airport-comp-verdict

## Goal
Give `/partnerships/near/[icao]` the same "~X% below/above market" buy-in comp
chip that every other partnership browse surface already shows, closing a
parity gap in the proprietary buyer-analysis pillar.

## Background
`PartnershipList.tsx` (used by `/partnerships`, `/partnerships/make/[make]`,
`/partnerships/state/[state]`) batch-fetches other same-make active buy-in
prices per unique make, runs `partnershipBuyInComp`, and passes a `compVerdict`
prop into `PartnershipCard`, which renders a "~12% below market · $45k · 6
comps" chip. `/partnerships/near/[icao]/page.tsx` renders `PartnershipCard`
directly (not through `PartnershipList`) and never computes this, so its cards
never show the chip even when the data supports it — a real proprietary
buyer-analysis signal silently missing from one browse surface.

## Scope
- `src/lib/partnershipComps.ts`: add a new exported async helper,
  `getPartnershipCompVerdicts(supabase, listings)`, that contains the exact
  batching logic currently inlined in `PartnershipList.tsx` (unique-make
  price fetch, `partnershipBuyInComp` per row, filter to non-"near" verdicts)
  and returns the `Map<string, {kind, pct, median, count}>`.
- `src/components/PartnershipList.tsx`: replace its inlined batching block
  with a call to the new shared helper (no behavior change here — pure
  extraction).
- `src/app/partnerships/near/[icao]/page.tsx`: call the same helper on
  `results.map(r => r.p)` and pass `compVerdict={verdicts.get(p.id)}` into
  each `PartnershipCard`.
- No schema changes. No new DB tables/columns. Read-only additive queries
  (same shape already proven safe on the other browse pages).

## Acceptance criteria
- `/partnerships/near/[icao]` cards show the same "below/above market" chip
  as `/partnerships` for listings that clear `MIN_OTHER_COMPS`, with identical
  thresholds (dead-band, min comps) — no fabricated numbers, self-suppresses
  same as everywhere else.
- `PartnershipList.tsx` behavior on `/partnerships`, `/partnerships/make/*`,
  `/partnerships/state/*` is unchanged (same chips, same query shape) — this
  is a pure refactor for that surface.
- `npx next build` + typecheck pass.
- `qa-smoke.mjs` passes (HTTP 200, no console errors, no horizontal overflow)
  at desktop 1280 + mobile 375 on `/partnerships/near/khwd` (or another ICAO
  with >= MIN_NEARBY nearby partnerships) and `/partnerships`.
- Query failure still fails soft (try/catch — cards render without chips, no
  page error), matching existing behavior.

## Out of scope
- Any change to the comp math/thresholds themselves.
- Any change to `/saved` (also renders `PartnershipCard` without a verdict,
  but that's "your saved items," not a discovery/comparison browse surface —
  lower value, separate slice if ever pursued).
- Any schema change.
