# Overlapping-alert cleanup nudge on `/alerts/manage`

## Goal
Detect when a subscriber's confirmed alert is redundant because a *broader* alert of
theirs already covers it exactly, and offer a one-click way to remove the narrower one —
so the combined digest stops repeating the same listings across two sections.

## Scope
- New pure module `src/lib/alertOverlap.ts`: conservative subsumption detector operating
  on `EditableAlertTarget` (the same shape `/alerts/manage`'s edit form + widen-nudge
  already use). Any alert carrying a hidden (non-form-exposed) criterion is excluded
  entirely from comparison — never a false "covered" claim.
- New client component `src/components/OverlapAlertNudge.tsx`: renders the nudge text +
  a "remove this one" button (reuses the existing `deleteAlert` server action) + a "keep
  both" dismiss (session-local, mirrors `ManageAlertCrossSell`'s dismiss pattern).
- Wire into `src/app/alerts/manage/page.tsx`: compute `editTargets` once per alert (reuse
  for both the existing Edit form and the new overlap check), call
  `detectOverlappingAlerts`, render the nudge under a narrower alert's row — mutually
  exclusive with the existing dead-alert widen nudge (a 0-match alert gets the widen
  nudge, not this one).
- Unit tests (`src/lib/alertOverlap.test.ts`, plain `node --test`, no `@/` alias
  imports — this module only takes `import type` from `alertEditCriteria.ts`, which
  Node's type-stripping runner erases): state/price/model/dealOnly edge cases, hidden-
  criteria exclusion, exact-duplicate (ambiguous) non-detection.

## Acceptance criteria
- `/aircraft?make=Cessna` (broader) + `/aircraft?make=Cessna&model=172` (narrower), both
  confirmed → the narrower alert's row shows "already covered by your 'Cessna' alert."
- Two exact-duplicate alerts (identical criteria) → no nudge (ambiguous which is
  "narrower").
- An alert with a hidden criterion (e.g. `grade=A` not exposed on the edit form) is never
  claimed as "covered" or "covers" another — excluded from comparison entirely.
- Clicking "remove this one" calls the existing owner-scoped `deleteAlert` action and the
  row disappears (list re-renders via the action's existing `revalidatePath`).
- Clicking "keep both" dismisses the nudge for the rest of this page view (no persistence
  needed — mirrors `ManageAlertCrossSell`).
- A dead (0-match) alert shows the existing widen nudge, not this one, even if it also
  happens to be subsumed by a broader alert.
- No schema change, no new capture point, `npx tsc --noEmit` + `npx next build` green.

## Out of scope
- Numeric-range subsumption (e.g. `min_price=50000` vs `min_price=80000`) — exact-value
  match only.
- Alerts on legacy/curated SEO paths (`/aircraft/cessna`, etc.) — `parseEditableAlertTarget`
  already returns `null` for those (no Edit button either), so they're excluded the same
  way the existing widen nudge already excludes them.
- Persisting a dismissal across page reloads.
