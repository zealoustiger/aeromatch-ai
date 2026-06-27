# Spec: partnership-deal-signals

**UTC:** 20260627T081804Z  
**Slug:** partnership-deal-signals  
**Pillar:** Buyer analysis (Pillar 3)

## Goal

Add a "How this partnership stacks up" synthesis panel to the partnership detail page (`/partnerships/[id]`), mirroring the DealScorePanel on aircraft listing pages. Buyers currently see PartnershipMarketCheck in the sidebar but have no at-a-glance orientation in the main column summarising all available signals together.

## Scope

- **New file:** `src/components/PartnershipDealSignals.tsx` — pure server component, computes and renders up to 3 signals
- **Modified file:** `src/app/partnerships/[id]/page.tsx` — import + render after the description panel in the main column; passes already-fetched `partnerComp`

No new DB queries (reuses `partnerComp` already computed on the page). No schema change.

## Signals (in order)

1. **Buy-in vs market** — from `partnerComp.kind` (`'below'` → emerald, `'near'` → slate, `'above'` → amber). Shows delta dollars + pct + comp count. Self-skips when `partnerComp` is null (< 4 comps or no buy-in price).
2. **Days listed** — computed from `p.posted_at` (preferred) or `p.created_at`. ≤ 3 days → neutral "Just listed / Listed today"; 4–89 days → neutral "Listed N days ago"; ≥ 90 days → positive "Listed N months ago — seller may have flexibility".
3. **Cost transparency** — buy_in + monthly_fixed + hourly_wet presence. All three → positive "Fully priced". Buy-in + one of monthly/wet → neutral with note about missing rate. If both monthly and wet missing, no signal (too thin to add value).

Panel self-suppresses when fewer than 2 rows are produced.

## Acceptance criteria

- [ ] Panel renders in the main column below the description panel on `/partnerships/[id]` when ≥ 2 signals are actionable
- [ ] Buy-in signal shows correct kind (below/near/above) with delta + comp count
- [ ] Days-listed signal always shows (every partnership has a date)
- [ ] Cost-transparency signal appears when ≥ 2 cost fields are present
- [ ] Panel self-suppresses (renders null) when fewer than 2 signals — verified on a listing with no buy-in and limited data
- [ ] No new console errors; smoke exits 0 on `/partnerships/[id]` at desktop 1280 + mobile 375
- [ ] `npx next build` passes clean

## Out of scope

- Price history on partnerships (no `previous_price` column on the `partnerships` table)
- Interactive elements or client state
- Any DB schema change
- Changes to PartnershipMarketCheck sidebar panel (unchanged)
