# Spec: "Narrow this alert?" nudge for very-high-volume alerts

## Goal
On `/alerts/manage`, a confirmed aircraft alert currently matching a large number of
live listings (make-only or nationwide, e.g. "Cessna" = 253 matches) gets an honest,
live-verified one-tap suggestion to narrow it (add the dominant model / add the
dominant state / cap the price), so its digest stops reading as spam — the inverse of
the existing "widen this dead alert" nudge (GOAL.md's never-spam pillar cuts both ways).

## Scope
- `src/lib/alertMatchCounts.ts` — new `getNarrowSuggestions(sourcePath, currentCount)`:
  above a 75-match threshold, computes up to 2 candidate tighteners (dominant model,
  dominant state, price cap at the matching set's median) from the alert's own EDITABLE
  target (`parseEditableAlertTarget`), then re-verifies each against a real live count
  via the existing `getAlertMatchCount` before ever offering it (drops anything that
  would leave 0 matches or doesn't actually narrow the count). Aircraft-type alerts
  only — partnerships/seekers never approach the threshold on this marketplace today
  (23 total active partnerships site-wide), so a candidate for them would be untestable
  dead code.
- `src/components/NarrowAlertNudge.tsx` — new client component, same shape/pattern as
  the existing `WidenAlertNudge.tsx`: renders the (already server-computed +
  re-verified) suggestions as one-tap buttons, applies via the existing
  `updateAlertCriteria` server action (no new action, no schema change).
- `src/app/alerts/manage/page.tsx` — compute `narrowSuggestions` per confirmed alert row
  (parallel with the existing `widenSuggestions` computation) and render
  `<NarrowAlertNudge>` alongside `<WidenAlertNudge>`/`<OverlapAlertNudge>`.

## Acceptance criteria
- A confirmed aircraft alert matching >75 live listings and missing model/state/price
  shows a "Matching a lot right now — narrow it?" nudge with 1-2 concrete one-tap
  buttons naming the real resulting count (e.g. "Only Cessna 172 — 34 listings").
- Clicking a button updates the alert's `source_path`/`context` in place (reusing
  `updateAlertCriteria`) and swaps to a confirmation line — no page reload, no schema
  change, no new capture point / analytics event (this is a criteria edit, not a new
  subscribe).
- Every offered candidate is live-verified to leave >0 matches before being shown —
  never a guess, never a dead end.
- An alert at or below the threshold, a dead (0-match) alert, or a non-aircraft alert
  renders no nudge (component returns `null`).
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke passes on `/alerts/manage` (desktop 1280 + mobile 375, HTTP 200, zero
  console errors, zero horizontal overflow); this is a VISUAL cycle (new rendered UI) —
  screenshots read into the QA verdict.

## Out of scope
- Partnership/seeker narrow suggestions (see rationale above).
- A persisted "don't ask again" dismissal (mirrors `WidenAlertNudge`'s own scope — no
  dismiss state, just apply-or-ignore).
- Any change to the digest cron's send logic or match-counting semantics.
