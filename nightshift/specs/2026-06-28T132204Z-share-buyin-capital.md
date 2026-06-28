# share-buyin-capital — show the one-time buy-in per share on "Cost to own"

## Goal
On the aircraft listing detail page, show the **one-time capital buy-in** for each
co-ownership share (asking price ÷ N), alongside the recurring monthly/annual cost the
"Cost to own" panel already shows — so a buyer sees the full "~$X to buy in + ~$Y/mo to
run it" picture instead of only the running cost.

## Why (Pillar 3 — proprietary buyer analysis)
The backlog and GOAL.md both call for exactly this and it's the missing half today:
- GOAL.md line 104: "Partnership cross-sell — *split this into N shares → $X each* using buy-in math."
- BACKLOG cost-to-own item: a share-split toggle showing "*as a 1/3 partner: ~$X each + ~$Y/mo*".

The panel currently shows only the "~$Y/mo" recurring side. The buy-in capital — the single
biggest cost of getting into co-ownership — is absent. Adding it is pure arithmetic on the
real `asking_price` (no fabrication), proprietary (no listing site frames a for-sale plane as a
fractional buy-in), and honest (clearly labelled an estimate; actual buy-in is negotiated).

## Scope (small)
- `src/lib/calculators.ts` — add `buyInPerShare` to `ShareCostRow` and compute it
  (`Math.round(askingPrice / shares)`) in `estimateShareCosts`.
- `src/components/ShareCostPanel.tsx` — render the buy-in in the featured selected-share card
  and as a column in the comparison table; tweak the caveat copy.
- `src/lib/calculators.test.ts` — add a unit assertion for `buyInPerShare`.

## Acceptance criteria
- [ ] `estimateShareCosts(price)` returns each row with `buyInPerShare = round(price / shares)`
      (sole = full price, 1/2 = half, etc.); unit test added and passing.
- [ ] The featured selected-share card shows the buy-in (e.g. "≈ $100,000 to buy in") next to
      the existing $/mo figure.
- [ ] The comparison table gains a "Buy-in" column showing the per-share capital for every row.
- [ ] Copy clearly frames the buy-in as an estimate based on the asking price (negotiated in
      practice) — no implied appraisal.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200 / no console errors / no overflow
      at 1280 + 375) passes on a real aircraft listing detail page; the panel renders correctly.

## Out of scope
- Changing the recurring-cost math, the engine-reserve fold-in, or the standalone calculator.
- Any change to the partnership cross-sell panel or partnership pages.
- New schema, new DB reads, or any pricing/monetization.
