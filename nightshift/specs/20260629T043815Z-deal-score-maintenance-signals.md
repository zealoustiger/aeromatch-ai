# Deal Score — fold maintenance signals (annual + damage) into the tally

**Slug:** `deal-score-maintenance-signals`
**Pillar:** 3 (proprietary buyer analysis) — rotation: last cycle P1
(partnership-make-freetext-datalist), two ago P3 (cost-per-flight-hour); P2's
headline items (Google OAuth / email-only signup) remain human-blocked behind the
frozen `/auth`, so Pillar 3 is the rotation-correct unblocked pillar.

## Goal
Make the aircraft listing's "How this stacks up" Deal Score verdict reflect the two
maintenance signals we already compute on the page — annual-inspection status and
damage history — instead of leaving them only in their own detail panels below. The
headline synthesis should include the near-term-cost / condition reads a buyer cares
about, with the same honesty framing as the source panels.

This is the slice explicitly teed up by the `deal-score-signal-tally` / `damage-history-read`
CHANGELOG `Next:` lines ("fold the annual-inspection status into the Deal Score tally as
a fifth signal" / "could fold the damage flag into the Deal Score signal tally").

## Scope (small)
- `src/app/aircraft/listing/[id]/page.tsx` only:
  - Extend `computeDealSignals(...)` to accept the already-computed `annualStatus`
    (`AnnualStatusResult | null`) and `damage` (`DamageHistoryResult | null`) and append
    one honest tally row for each when present.
  - Update the single call site (it's already in scope — `annualStatus` and `damage` are
    computed above the call).
  - Update the panel footer copy to mention maintenance signals.

## Acceptance criteria
- When `annual_due` resolves to a status, the Deal Score shows one row:
  `current` → positive ("Annual current"), `soon` → neutral ("Annual due soon"),
  `overdue` → negative ("Annual may be overdue"). Copy reuses the panel's honest
  "the listing states…/confirm" framing; no fabricated day-counts (month granularity).
- When `damage_history` is a real boolean, the Deal Score shows one row:
  `false` → positive ("No damage reported", framed as the seller's claim not the
  logbooks), `true` → negative ("Prior damage reported", with the ask-for-records action).
- When either input is `null` (missing/unparseable), NO corresponding row appears —
  the function relies on the existing upstream self-suppression (never infers "no damage"
  or a fabricated annual status). The tally chips ("N in this listing's favor" / "N to
  ask about") update automatically from the new positive/negative rows.
- `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors / no
  horizontal overflow at 1280 + 375) passes on an aircraft listing detail page; the
  panel renders correctly with the extra rows (visual check).

## Out of scope
- No new DB columns, queries, or extraction changes (both inputs already on the page).
- No change to the annual/damage detail panels themselves, or to the underlying libs.
- No change to the partnership detail page (partnerships carry neither column).
- No new composite numeric score.
