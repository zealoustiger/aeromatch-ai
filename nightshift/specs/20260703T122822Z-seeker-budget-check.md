# seeker-budget-check

## Goal
Give a partnership-seeker listing a proprietary "is your budget realistic" read — the
same honesty-gated market-comp analysis aircraft-for-sale and partnership listings
already have, applied to the one listing type (seeking) that currently has zero
Pillar 3 buyer-analysis coverage.

## Why
Aircraft-for-sale and partnership detail pages both answer "is this a good deal?" via
comp verdicts. A seeker states a budget (`max_buy_in`) and an aircraft preference but
gets no equivalent read on whether that budget is realistic for what they want — a
real, previously-unaddressed parity gap (confirmed: no comp/verdict helper is imported
anywhere under `src/app/partnerships/seeking/**`). The existing `partnershipBuyInComp`
helper in `src/lib/partnershipComps.ts` already normalizes buy-in by share size via
implied full-aircraft value — exactly the math needed to check a seeker's budget
against the going rate for the share size they want. No new pure function needed.

## Scope
- New `getSeekerBudgetCheck(supabase, seeker)` query helper (in
  `src/lib/partnershipComps.ts`) that:
  - Only computes a check when the seeker has exactly ONE `preferred_makes` entry,
    a `max_buy_in`, and exactly ONE fractional `preferred_share_types` entry
    (`'1/2'`, `'1/3'`, or `'1/4'` → maps to share count 2/3/4). Ambiguous inputs
    (multiple makes, multiple/no share types, leaseback/dry_lease/other) return null —
    honesty gate, no guessing which share size or make to check.
  - Queries active partnerships for that make (mirrors `getPartnershipCompVerdicts`'s
    query shape) and calls `partnershipBuyInComp(max_buy_in, shareCount, otherComps)`.
  - Fails soft (try/catch → null) like the existing comp helpers.
- New `SeekerBudgetCheck` component (models `PartnershipMarketCheck.tsx`'s shape) that
  renders the verdict in the Budget sidebar card on the seeker detail page:
  - "below" (seeker's budget is below the typical buy-in for that share size) →
    "Your budget may be tight" framing.
  - "above" → "Comfortably above typical" framing.
  - "near" → "About right for a typical {make} {share} share" framing.
- Wire into `src/app/partnerships/seeking/[id]/page.tsx` — one query, rendered in the
  existing Budget card.

## Acceptance criteria
- `/partnerships/seeking/[id]` for a seeker with a single make + single fractional
  share type + max_buy_in, where ≥4 other same-make partnerships with known buy-in
  and share count exist, renders a budget-check verdict (below/near/above) with the
  comp count and expected buy-in shown.
- A seeker missing any of make/share-type/buy-in specificity, or with fewer than 4
  qualifying comps, renders no budget-check panel (silent self-suppression, no error).
- No fabricated numbers: the verdict is always derived from real `partnerships` rows,
  never a hardcoded/estimated figure.
- `npx next build` passes (typecheck clean).
- QA smoke passes on `/partnerships/seeking/[id]` (desktop + mobile), no console
  errors, no horizontal overflow.
- No schema change, no edits to files under `FREEZE.md`.

## Out of scope
- Badge on `SeekerCard`/`SeekerList` browse surfaces (detail-page only this cycle).
- Multi-make or multi-share-type budget checks (ambiguous — left as "no verdict").
- Matching-partnerships-near-budget UX changes (existing `getMatchingPartnerships`
  untouched).
