# Capture-time widen alternative on zero-match empty states

## Goal
When a search on `/aircraft`, `/partnerships`, or `/partnerships/seeking` returns
zero results, the empty-state alert-capture box should offer a one-tap, server-
verified "or get alerts for the wider search" alternative instead of only "be
first to know" for a search that may never match.

## Scope
- New: `getEmptyStateWidenSuggestion` in `src/lib/alertMatchCounts.ts` — reuses
  `parseEditableAlertTarget` + `computeWidenCandidate` + `buildAlertCriteriaUpdate`
  (`src/lib/alertEditCriteria.ts`) to compute the single least-destructive
  loosening of the current zero-match search, then re-verifies it with
  `getAlertMatchCount` before ever offering it (honesty gate — never a guess).
- `src/components/AlertSignup.tsx` — new optional `widenSuggestion` prop; when
  present and the box's match count is 0, render a one-tap link under the
  "None ... right now" line that swaps the box's active context/sourcePath/
  matchCount to the widened search (no page reload, no second component).
  `alert_subscribed` payload gets `widened: true` when the subscription used
  the widened search.
- `src/components/AircraftSaleList.tsx`, `PartnershipList.tsx`, `SeekerList.tsx`
  — compute the suggestion (only in the zero-results branch) and pass it
  through to the empty-state `AlertSignup`.

## Acceptance criteria
- A zero-match aircraft search whose widened (make-only, or nationwide) version
  has real active matches shows "Show all {Make} listings — N listings match
  now" (or the state-drop / partnership / seeker equivalents) under the empty
  state's alert box.
- Clicking it swaps the box in place to the wider search (headline/subcopy/
  match-count line update, no navigation) and submitting subscribes to the
  wider `source_path` — no second alert row, no duplicate box.
- A search that's already make-only/nationwide, or whose widened version is
  *also* genuinely zero, shows no widen link (honesty gate — never a fabricated
  or dead-end suggestion).
- No change to any capture point where `matchCount` isn't 0 (listing detail,
  browse-with-results, homepage, etc.) — this only ever appears in the
  zero-result empty state.
- `npx next build` + `npx tsc --noEmit` pass; QA smoke gate passes on
  `/aircraft`, `/partnerships`, `/partnerships/seeking` at desktop 1280 +
  mobile 375.

## Out of scope
- Multiple stacked widen steps (only ever the single next step, same as the
  existing `/alerts/manage` widen nudge).
- Widening price range or deal-only (per `computeWidenCandidate`'s existing
  scope — never touches make/price).
- Any change to the already-shipped `/alerts/manage` `WidenAlertNudge`.
