# Spec: partnership-comp-pill-enriched

**UTC:** 2026-06-29T123752Z
**Pillar:** Proprietary buyer analysis (Pillar 3)

## Goal
Partnership browse cards now show the market median buy-in and comp count inside the "below/above market" chip — matching what aircraft cards show after `comp-pill-median-price` — so buyers scanning partnerships can anchor the percentage to a real dollar figure.

## Background
The `PartnershipCard` already shows `"~22% below market"` when `compVerdict` is set, and `partnershipComps.ts` already returns `median` and `count`. But `PartnershipList.tsx` only passes `{ kind, pct }` to the card, dropping the richer data. The aircraft `CompPill` on browse cards shows `"~47% below avg · $135k · 37 comps"` — this cycle brings partnership cards to parity.

## Scope — files to touch
- `src/components/PartnershipCard.tsx` — add `median` and `count` to `compVerdict` prop type; update rendering to show `~22% below market · $85k · 8 comps` with a hover tooltip `vs. median $85,000`
- `src/components/PartnershipList.tsx` — pass `median` and `count` from `partnershipBuyInComp` result into the verdicts map

## Acceptance criteria
1. Partnership browse cards whose comp chip shows "below market" or "above market" now also display the median buy-in in compact `$Xk` format and the comp count: e.g. `"~22% below market · $85k · 8 comps"`.
2. Hovering (or tapping on mobile) the chip shows a tooltip with the full median: e.g. `"vs. median $84,500"`.
3. "Near market" cards (±5% dead-band) self-suppress as before — no chip rendered for those.
4. Cards with no buy-in price, or buy-in but fewer than 4 same-make comps, render no chip (honesty floor unchanged).
5. No horizontal overflow at desktop 1280 or mobile 375.
6. Build and typecheck pass with zero errors.

## Out of scope
- Any change to `partnershipComps.ts` math or thresholds.
- The partnership detail page (comp context there is separate).
- Aircraft cards, aircraft comp logic, or any other list surface.
