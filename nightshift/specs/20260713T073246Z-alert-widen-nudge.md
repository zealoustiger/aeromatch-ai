# Alert widen nudge on /alerts/manage

## Goal
When a confirmed, editable alert on `/alerts/manage` currently matches 0 live listings, show one honest, verified one-click "widen" suggestion (or an honest "nothing close yet" fallback) instead of leaving the dead alert silent.

## Scope
- `src/lib/alertEditCriteria.ts` — add `computeWidenCandidate(target)`, a pure function that picks the single least-destructive loosening (drop model → make-wide, else clear state/airport) for each editable alert type, or returns `null` when there's nothing left to widen.
- `src/app/alerts/manage/page.tsx` — for each confirmed row whose live match count is 0 and whose `source_path` is editable, compute the widen candidate, build its widened `source_path` via the existing `buildAlertCriteriaUpdate`, and re-verify with the existing `getAlertMatchCount` (honesty gate — only suggest a widen that provably yields >0 real matches right now).
- New `src/components/WidenAlertNudge.tsx` (client) — renders the verified widen button (applies via the existing `updateAlertCriteria` action, same as the Edit form) or the "nothing close yet — we'll keep watching" fallback when no widen helps.

## Acceptance criteria
- A confirmed, editable alert (aircraft/partnership/seeker query-string shape) with 0 live matches shows a widen suggestion only when a real, server-verified widened search yields >0 matches — never a fabricated count.
- Clicking the widen button persists the widened criteria via `updateAlertCriteria` (existing action, existing ownership/validation) and the row updates in place (no full reload) — same UX precedent as the existing Edit form / cross-sell box.
- An alert with genuinely no viable widen (e.g. already make-only nationwide, or the make-wide/state-wide search is still 0) shows the honest "nothing close yet" text, never a broken/no-op button.
- Non-editable alerts (legacy SEO path-segment shapes) and "watch this listing/partnership" alerts are unaffected — no nudge renders for them (unchanged from today).
- `npx next build` + typecheck pass; QA smoke on `/alerts/manage` passes at desktop 1280 + mobile 375 with zero new console errors and no overflow.
- No schema change, no new capture point, no change to the digest cron.

## Out of scope
- Widening price ranges or dropping `make` itself (only the model/state/airport single-step loosening described in BACKLOG.md).
- Any change to non-editable (legacy path-segment) alert shapes.
- The other open `[P2][goal]` backlog item (stranded pending-alert confirm reminder) — separate slice, needs a schema column + cron change.
