# seeker-budget-check-range-bar

## Goal
Port the honest low–high/percentile range bar (already shipped on the aircraft
Estimate and `PartnershipMarketCheck`) onto the seeker detail page's Budget Check
panel, since `getSeekerBudgetCheck` already computes `low`/`high`/`percentile` but
`SeekerBudgetCheck.tsx` silently discards them.

## Why this is a genuine gap, not settled work
`BACKLOG.md`'s `partnership-market-check-range-bar` entry says the seeker panel was
"intentionally left alone (a single stated-budget number isn't a comp-set spread in
the same shape)." Reading `getSeekerBudgetCheck` (`src/lib/partnershipComps.ts:466`)
shows that reasoning doesn't hold: it calls `partnershipBuyInComp` — the exact same
function powering the partnership market check — and returns the full
`PartnerCompResult`, which always carries `low`/`high`/`percentile`
(`partnershipComps.ts:49-70`). The seeker's `max_buy_in` plays the identical role a
listing's `buy_in_price` plays elsewhere. `SeekerBudgetCheck.tsx` only destructures
`kind`/`deltaDollars`/`pct`/`median`/`count` (lines 39-46) and never reads
`result.low`/`result.high`/`result.percentile` even though they're already on the
prop it receives. No new data, no new query, no new honesty floor — same
`MIN_OTHER_COMPS` gate already applied upstream.

## Scope
- `src/components/SeekerBudgetCheck.tsx` only — add the visual range bar, mirroring
  `PartnershipMarketCheck.tsx`'s existing bar block (median tick + "your budget"
  marker, clamped 0-100%, `role="img"` aria-label, legend row).
- Derive the seeker's budget position the same way `PartnershipMarketCheck` derives
  its subject position: `buyIn = result.median + result.deltaDollars`.
- Update the descriptive sentence to mention the low–high range when `hasRange`
  (`result.high > result.low`), falling back to today's plain median sentence
  otherwise — same pattern as `PartnershipMarketCheck`.
- No changes to `src/lib/partnershipComps.ts`, no schema change, no caller changes
  (the page already passes the full `result` object).

## Acceptance criteria
- When `result.high > result.low`, the panel renders a low–high spread bar with a
  median tick and a "your budget" marker positioned via the same
  `(value - low) / (high - low) * 100` clamp used elsewhere.
- The bar and its legend/aria-label read "your budget" (not "this listing" —
  copy must fit a seeker's own stated max, not a published listing).
- When `result.high === result.low` (degenerate/empty spread), the panel falls back
  to the existing plain-median sentence with no bar — matches current behavior for
  that edge case, no regression.
- `npx next build` + typecheck pass.
- QA smoke passes at desktop 1280 + mobile 375 on `/partnerships/seeking/[id]` with
  no new console errors and no horizontal overflow.
- No fabricated numbers — every rendered value traces to fields already on
  `PartnerCompResult`.

## Out of scope
- Any change to `getSeekerBudgetCheck`, `partnershipBuyInComp`, or the comp query.
- The seeker detail page's missing "How this stacks up" synthesis panel (bigger,
  separate slice — flagged by the audit as a runner-up, needs its own design).
- Any change to `PartnershipMarketCheck.tsx` or the aircraft Estimate panel.
