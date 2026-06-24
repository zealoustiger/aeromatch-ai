# Seeking-partnership profile: fill the empty right rail

**Lane:** `[want]` (last non-bug cycle `model-specs-highlights-batch2` pulled `[goal]`; last cycle PASS, no blocker → `[want]` owed per the 1:1).
**Backlog item:** `[P2][want] Seeking-partnership profile: fill the empty right rail`.

## Goal
On the "Seeking a partnership share" detail page (`/partnerships/seeking/[id]`), move the
**Aircraft Preferences** and **Flying Profile** cards out of the full-width left column and
into the **right rail**, so key match facts sit beside the contact CTA and the sparse right
column is balanced — keeping "About me" as the main left column.

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx` (only this file).

## Acceptance criteria
- The **Aircraft Preferences** and **Flying Profile** cards render in the **right sidebar**,
  not the left column.
- The left column keeps the pilot header + **About me** card as its main content.
- Right-rail order is sensible: Budget → Aircraft Preferences → Flying Profile → Contact CTA.
- The moved cards' inner `dl` grids collapse to a single column so they don't look cramped in
  the narrow rail (no overflow at 1280 or 375).
- No data/logic change: the same fields render under the same conditions (cards still
  conditionally hide when their data is absent). No new console errors.
- `next build` + typecheck pass; QA smoke passes at 1280 + 375; screenshots look right.

## Out of scope
- No copy/wording changes, no new fields, no schema changes.
- No changes to the Budget card, Contact card, privacy gating, or any other page.
- No restyle of the cards beyond the grid-column tweak needed for the narrow rail.
