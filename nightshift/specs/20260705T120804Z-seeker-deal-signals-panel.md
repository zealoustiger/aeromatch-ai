# seeker-deal-signals-panel

## Goal
Give the seeker detail page (`/partnerships/seeking/[id]`) the same "how this stacks up"
multi-signal synthesis panel that aircraft-for-sale and partnership listings already have,
closing the last standing Pillar 3 (buyer-analysis) parity gap.

## Scope
- New `src/components/SeekerDealSignals.tsx` — mirrors `PartnershipDealSignals.tsx`'s pattern
  (pure `computeSignals` function + tally-chip UI), synthesizing signals already computed or
  trivially derivable on the seeker detail page:
  1. Budget-vs-market read (from the existing `getSeekerBudgetCheck` result's `kind` —
     `below` = budget may be tight (negative/watch-out), `near`/`above` = realistic/comfortable
     (positive)). Self-suppresses (row omitted) when `budgetCheck` is null.
  2. Aircraft-preference specificity — a stated make/model/category vs. "open to any"
     (reuses the same boolean `evaluateSeekerTrust`'s `hasAircraftPreference` already checks,
     inlined here since it's a one-line condition).
  3. Experience disclosed — total hours + at least one rating held (same condition as the
     trust signal), phrased as a buyer-analysis read ("owners can verify qualification") not
     a completeness checkbox (that's the trust badge's job, not duplicated here).
  4. Cost transparency — fully priced (buy-in + monthly + hourly) vs. partially priced, same
     shape as `PartnershipDealSignals`' existing "Fully priced"/"Partially priced" rows.
  5. Days listed — same freshness read (`Listed N days ago` / `about N months ago`) already
     computed inline on the page via `listedAgo`, reformatted into the same tally-row shape
     the other two panels use.
  - Self-suppresses entirely (returns `null`) when fewer than 2 rows are actionable, matching
    the other two panels' honesty floor.
- `src/app/partnerships/seeking/[id]/page.tsx` — import and render `SeekerDealSignals` in the
  sidebar, directly above the existing `SeekerBudgetCheck`/`PartnerShareCostPanel` block (same
  "top of sidebar analysis stack" placement convention as the other two detail pages).

## Acceptance criteria
- `SeekerDealSignals` renders nothing when passed a seeker with no aircraft preference, no
  budget, no experience, and no `budgetCheck` (i.e. fewer than 2 real signals) — no thin/empty
  panel ever ships.
- With a seeker that has an aircraft preference, disclosed experience, and a budget, the panel
  renders at least 2 rows and the tally chip counts only positive/negative rows (never neutral).
- No new query, no schema change — every input is either already fetched on the page
  (`budgetCheck`) or derived from fields already on `PartnershipSeeker`.
- `npx next build` passes with no new type errors.
- QA smoke passes (HTTP 200, zero app-origin console errors, zero horizontal overflow) at
  desktop 1280 + mobile 375 on `/partnerships/seeking/[id]`.
- Visually, the panel matches the existing sidebar card style (`ch-panel`/rounded-xl white
  card, same chip/dot conventions as `PartnershipDealSignals`).

## Out of scope
- Any change to `getSeekerBudgetCheck`, `evaluateSeekerTrust`, or any other existing lib
  function — this is a pure new rendering layer over already-computed/derivable data.
- Any DB migration or new column.
- Card/rail-card versions of this panel (it's a detail-page-only synthesis, same as its two
  siblings — neither of which has a card-level tally chip either).
