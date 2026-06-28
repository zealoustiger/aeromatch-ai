# partnership-comp-magnitude

## Goal
Bring the partnership browse comp chip to parity with the aircraft browse card: show
the actual magnitude ("~X% below market" / "~X% above market") instead of a vague
"Below market" / "Above market", reusing the percentage `partnershipBuyInComp`
already computes — a more useful, proprietary, honest buyer signal.

## Pillar
Pillar 3 — proprietary buyer analysis. Rotation: last 3 cycles were Pillar 1
(partnership-nnumber-autofill), Pillar 2 (contact-intent-restore), Pillar 3
(partnership-model-filter). Pillar 3 was not advanced in the last 2 cycles → rotate here.

## Background / why this is the gap
- `src/lib/partnershipComps.ts#partnershipBuyInComp` already returns a `pct` (whole-number
  percent distance from the same-make buy-in median), honesty-gated by `MIN_OTHER_COMPS = 4`
  and a ±5% dead-band ("near" → no chip).
- `PartnershipList.tsx` computes that result per card but stores only `result.kind`
  ('below' | 'above') in its `verdicts` map, discarding the magnitude.
- `PartnershipCard.tsx` renders only "Below market" / "Above market" (no number).
- The aircraft browse card (`AircraftSaleCard.tsx#CompPill`) shows "~X% below average" — so
  the partnership browse surface is strictly less informative than the aircraft one for the
  same underlying comp math.
- The partnership *similar-rail* card (`PartnershipRailCard`) is left qualitative on purpose:
  the aircraft *similar-rail* (`AircraftRailCard`) is also qualitative ("Good deal"/"Priced
  high"), so the rails already match — only the browse cards diverge.

## Scope (files expected to touch — small)
- `src/components/PartnershipCard.tsx` — widen the `compVerdict` prop from
  `'below' | 'above'` to `{ kind: 'below' | 'above'; pct: number }`; render
  "~{pct}% below market" / "~{pct}% above market".
- `src/components/PartnershipList.tsx` — store `{ kind, pct }` (not just `kind`) in the
  `verdicts` map and pass it through.

## Acceptance criteria
- [ ] Partnership browse cards (`/partnerships`) that qualify (≥4 other same-make priced
      comps, outside the ±5% dead-band) show "~X% below market" or "~X% above market".
- [ ] Cards inside the dead-band ("near") or with too few comps still show NO chip
      (no fabricated/zero-percent chip) — honesty floors unchanged.
- [ ] `pct` is always ≥1 (already guaranteed by `partnershipBuyInComp`) — never "~0%".
- [ ] Below-market keeps the emerald (positive) treatment; above-market keeps amber.
- [ ] `npx next build` + typecheck pass; QA smoke exit 0 on `/partnerships` at 1280 + 375
      (HTTP 200, no app-origin console errors, no horizontal overflow); chip renders correctly
      in screenshots (visual cycle).

## Out of scope
- The partnership similar-rail card (`PartnershipRailCard`) — kept qualitative to match the
  aircraft similar-rail.
- Any change to the comp math, thresholds, or DB queries.
- Detail-page `PartnershipDealSignals` (already shows magnitude on the detail page).
