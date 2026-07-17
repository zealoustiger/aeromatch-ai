# alert-manage-row-overflow

## Goal
Fix the filed `[P1][bug]`: `/alerts/manage` alert-row action-button cluster
(Share/View/Pause/Resume/Delete/Edit) horizontally overflows the viewport at
375px whenever a real alert row renders, because the wrapper's `shrink-0`
forces it to lay out at max-content width instead of shrinking and letting
its own `flex-wrap` kick in.

## Scope
- `src/app/alerts/manage/page.tsx` — the row action-cluster wrapper div
  (currently `className="flex shrink-0 flex-wrap items-center gap-2"`,
  around line 372). Drop `shrink-0` (or swap for `min-w-0`) so the div can
  shrink to the `<li>`'s available width and its own `flex-wrap` wraps the
  buttons instead of spilling off the right edge.
- No change to `AlertEditForm.tsx`, `ShareAlertButton.tsx`, `AlertActions.tsx`,
  or any other component — this is a one-line wrapper-class fix.

## Acceptance criteria
- At 375px, with a real confirmed alert row rendered, `document.documentElement.scrollWidth`
  equals `clientWidth` (no horizontal overflow) — verified live with a seeded
  throwaway `@example.com` alert, not just the logged-out empty state.
- The button row still renders and functions identically at desktop 1280px
  (View / Pause / Edit visible, same spacing) — no desktop regression.
- Verified across at least 2 alert statuses that render different button sets
  (e.g. `confirmed` → Pause/Edit, `paused` → Resume/Edit) if feasible within
  the cycle, since each renders a different button count/width.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `qa-smoke.mjs` passes on `/alerts/manage` (logged-out empty state, the only
  state the automated gate can exercise) at desktop 1280 + mobile 375.

## Out of scope
- Any redesign of the button cluster itself (icons-only, dropdown menu, etc.) —
  purely the wrapping/shrink behavior.
- `CompareTray` / `DeviceSaveSync` follow-up mentioned in an earlier changelog
  entry — unrelated components, not touched here.
