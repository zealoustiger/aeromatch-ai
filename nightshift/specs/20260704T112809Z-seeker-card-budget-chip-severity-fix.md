# seeker-card-budget-chip-severity-fix

## Goal
Fix the seeker browse-card budget chip (`SeekerCard.tsx`) so its color/severity matches the
already-correct semantics on the seeker detail page's `SeekerBudgetCheck` panel, instead of
inverting them.

## Context / bug
`getSeekerBudgetCheck`/`getSeekerBudgetCheckVerdicts` return a `partnershipBuyInComp`-style
verdict where `kind: 'below'` means "the dollar amount is below the market median." For a
**partnership's buy-in price** that's good news (a bargain) — correctly emerald on
`PartnershipCard`. But for a **seeker's stated budget**, `below` means their budget is *less*
than what similar shares typically cost — i.e. their budget looks tight, which is a caution,
not good news. `SeekerBudgetCheck.tsx` (the detail-page panel) gets this right: `below` → amber
"Budget may be tight", `above` → emerald "Comfortably above typical". `SeekerCard.tsx` copied
`PartnershipCard`'s chip styling verbatim and has it backwards: `below` renders emerald (looks
like good news) and `above` renders amber (looks like a caution) — the exact opposite of the
correct severity. This is a real trust/honesty bug under GOAL.md's Pillar 3 guardrail: the
chip is numerically accurate but actively miscommunicates severity in the direction that
matters most (telling a seeker their tight budget is fine, or their comfortable budget is a
problem).

## Scope
- `src/components/SeekerCard.tsx` — swap the `below`/`above` chip color classes (below → amber
  "may be tight" treatment, above → emerald "comfortably above" treatment) to match
  `SeekerBudgetCheck.tsx`'s `VERDICT_META`. Update the chip copy slightly if needed so the
  wording doesn't imply the wrong sentiment (e.g. avoid bare "below market"/"above market"
  phrasing that reads as a deal/no-deal signal borrowed from the partnership card).
- No changes to `src/lib/partnershipComps.ts` (the comp math itself is correct and shared).
- No changes to `SeekerBudgetCheck.tsx` (already correct — used as the reference).

## Acceptance criteria
- On `/partnerships/seeking` (and anywhere `SeekerCard`/`SeekerList` render), a seeker card
  whose `budgetVerdict.kind === 'below'` shows an amber/caution-styled chip (not emerald).
- A seeker card whose `budgetVerdict.kind === 'above'` shows an emerald/positive-styled chip
  (not amber).
- The chip's color/severity now matches what the same seeker's detail page
  (`/partnerships/seeking/[id]`) `SeekerBudgetCheck` panel shows for the identical verdict.
- No change to when the chip appears/self-suppresses (still gated by `budgetVerdict` being
  non-null from the existing honesty-gated comp function).
- `npx next build` compiles clean, no new TypeScript errors.
- No console errors or horizontal overflow introduced on `/partnerships/seeking` at desktop
  1280 / mobile 375.

## Out of scope
- Any change to the comp math, honesty gates, or thresholds in `partnershipComps.ts`.
- Any change to the partnership/aircraft card chips (their below=good/above=caution semantics
  are correct as-is — only the seeker card's *inverted copy* of that pattern is wrong).
- Re-deriving the seeker detail page panel (already correct).
