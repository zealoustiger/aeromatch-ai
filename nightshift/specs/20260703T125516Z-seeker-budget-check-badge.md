# seeker-budget-check-badge

## Goal
Surface the existing seeker budget-vs-market comparison as a badge on the seeker
browse cards (`SeekerCard`/`SeekerList`), not just on the seeker detail page —
closing the explicit follow-up noted in the `seeker-budget-check` spec/CHANGELOG
entry ("a card-level badge on SeekerCard/SeekerList mirroring the browse-page comp
chips partnerships already have").

## Scope
- `src/lib/partnershipComps.ts` — add `getSeekerBudgetCheckVerdicts(supabase, seekers)`,
  a batch sibling to `getSeekerBudgetCheck` that mirrors `getPartnershipCompVerdicts`'s
  unique-make batching (one query per unique preferred make, not one per seeker) to
  avoid N+1 queries on the browse list. Returns `Map<seekerId, PartnershipCompVerdict>`
  (reusing the existing `kind: 'below'|'above'` type; "near" is dropped, matching the
  partnership card convention).
- `src/components/SeekerList.tsx` — call the new batch helper (guarded by the same
  `hasSupabase` check `PartnershipList` uses) and pass the verdict down per card.
- `src/components/SeekerCard.tsx` — accept an optional `budgetVerdict` prop and render
  a badge in the existing badges row when present, styled like `PartnershipCard`'s
  comp chip (emerald "below market" / amber "above market", `~X% · $Xk median · N comps`).

## Acceptance criteria
- On `/partnerships/seeking`, a seeker card whose stated max buy-in is clearly below
  market (same honesty gates as the detail page: exactly 1 preferred make, exactly 1
  fractional preferred share type, ≥4 other same-make comps, outside the ±5% dead-band)
  shows a "below market" / "above market" badge; all other cards render with no badge
  (silent self-suppression, no placeholder/loading state).
- The badge never fabricates a number — same `MIN_OTHER_COMPS`/`DEAD_BAND` gates as
  `getSeekerBudgetCheck`/`partnershipBuyInComp`.
- The browse list issues at most O(unique makes) additional DB queries, not one per
  seeker card (verified by code inspection of the batching logic).
- No behavior change to the seeker detail page's existing `SeekerBudgetCheck` panel.
- `npx next build` + typecheck pass; QA smoke passes on `/partnerships/seeking` at
  desktop 1280 + mobile 375 with zero console errors and no horizontal overflow.

## Out of scope
- Changing the detail-page `SeekerBudgetCheck` component or its wording/gates.
- Adding this badge to any other listing type's card (aircraft/partnership already have
  their own equivalents).
- Any change to `preferred_makes`/`preferred_share_types` schema or seeker post form.
