# partnership-deal-check

## Goal
Give partnership listings the same year/hours-narrowed "Good deal / Fair price / Priced
high" value verdict that aircraft-for-sale listings already get (`clubHangerDealVerdict`),
closing a real Pillar 3 (proprietary buyer-analysis) parity gap: today a partnership only
gets the coarser whole-family "below/above market" buy-in comparison
(`partnershipBuyInComp`/`PartnershipMarketCheck`), never a value judgement controlled for
year and hours the way aircraft listings' "Deal check" block provides.

## Scope
- `src/lib/partnershipComps.ts` — new pure, unit-testable `partnershipDealVerdict()`
  mirroring `clubHangerDealVerdict` (similar-year ±5yr band, TTAF-preferred/SMOH-fallback
  hours band, ≥4 narrowed comps, ±5% dead-band) but normalized for share size the same way
  `partnershipBuyInComp` already does (implied full-aircraft value = buy-in × total_shares,
  median of narrowed implied values, scaled back down to the subject's own share size).
- `src/app/partnerships/[id]/page.tsx` — a **separate, independently-failing** query +
  try/catch for the year/ttaf/smoh-narrowed comp set (see honesty/safety note below), wired
  into a new `partnerDeal` variable, passed into `PartnershipMarketCheck`.
- `src/components/PartnershipMarketCheck.tsx` — new optional `deal`/`familyLabel` props;
  renders a "Deal check" sub-block (chip + sentence + comp-basis line) below the existing
  whole-family comparison, mirroring the aircraft detail page's `DealCheck` component
  verbatim in structure/copy style. Self-suppresses (renders nothing extra) when `deal` is
  null/undefined — fully backward compatible with the panel's current callers.

## Honesty / safety note (why the query must be independent)
`partnerships.ttaf`/`partnerships.smoh` are dormant behind the still-unapplied
`partnership_add_spec_fields` migration (confirmed unapplied as of several recent cycles —
an explicit `select` naming these columns 42703s in the live DB today). The **existing**
whole-family `partnerComp` query only selects columns that already exist
(`buy_in_price, total_shares, created_at, model`) and must keep working unmodified. The new
deal-check query selects `ttaf, smoh` too and MUST live in its own try/catch so that a
42703 there degrades `partnerDeal` to `null` (silent self-suppression, matching every other
dormant Pillar-3 signal in this codebase) without ever touching or breaking the already-
working `partnerComp`/`partnerDomContext` computation.

## Acceptance criteria
- [ ] `partnershipDealVerdict()` is a pure function (no DB/React) returning `null` when the
      subject lacks a real buy-in price / total_shares (< 2) / year / any hours signal, or
      when fewer than 4 comps fall inside both the year and hours bands.
- [ ] The detail-page wiring uses an independent query/try-catch from the existing
      `partnerComp` block — a missing `ttaf`/`smoh` column must not regress the currently-
      working whole-family market-check panel.
- [ ] `PartnershipMarketCheck` renders the new "Deal check" block only when a non-null
      verdict is passed; existing usage (no `deal` prop) renders exactly as before.
- [ ] `npx tsc --noEmit` and `npx next build` pass clean.
- [ ] QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal overflow)
      on `/partnerships/[id]` and `/partnerships` at desktop 1280 + mobile 375; screenshots
      read (visual cycle).
- [ ] No schema change, no fabricated numbers — verdict self-suppresses on thin data exactly
      like `clubHangerDealVerdict`.

## Out of scope
- Browse-card / rail-card parity for this new chip (detail-page only this cycle, same
  slicing precedent as the original aircraft Deal Check).
- The seeker-listing equivalent.
- Applying the pending `partnership_add_spec_fields` / `partnership_add_annual_damage`
  migrations (human action, flagged repeatedly in prior CHANGELOG entries).
