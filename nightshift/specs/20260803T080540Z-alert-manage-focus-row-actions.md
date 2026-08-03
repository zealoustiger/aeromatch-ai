# Spec — alert-manage-focus-row-actions

## Goal
On `/alerts/manage`, move keyboard/screen-reader focus to a sensible in-context
target after a row action (pause / resume / snooze / resend / send-sample /
delete) instead of letting focus fall back to `<body>` when the acted-on button
unmounts — a11y parity with the `alert-capture-focus-confirmation` cycle.

## Why
`AlertActions` already announces each result via an sr-only `role="status"`
live region, but manages no focus. After Pause succeeds the row re-renders with
a **Resume** button in place of **Pause** (the button that had focus unmounts),
so a keyboard/SR user's focus drops to `<body>` and they lose their place.
Delete is worse: the whole row unmounts and an Undo toast appears elsewhere on
the page with no focus moved to it.

## Scope (small)
- `src/components/AlertActions.tsx` — make the existing `role="status"` span
  focusable (`tabIndex={-1}`, `ref`) and move focus to it after a **successful
  non-delete** action (pause/resume/snooze/resend/send-sample). Delete is
  excluded here (its row unmounts — handled by the provider below).
- `src/components/AlertUndoProvider.tsx` — when the delete Undo toast appears
  (`pending` becomes set), move focus to the toast (already `role="status"`;
  add `ref` + `tabIndex={-1}` + a mount effect). This is the correct target for
  a delete-with-undo: it tells the SR user the alert was deleted and surfaces
  the actionable Undo control, instead of focus falling to `<body>`.

## Acceptance criteria
- After a successful **Pause** on a confirmed alert (real click), keyboard focus
  lands on that row's `role="status"` element (`document.activeElement` is the
  status span carrying "Alert paused."), NOT `<body>`.
- After a successful **Resume** on a paused alert, focus lands on that row's
  `role="status"` element.
- After a successful **Delete**, focus moves to the Undo toast (its focusable
  container), NOT `<body>`; the toast's "Undo" button is reachable with one Tab.
- No visual change at desktop 1280 or mobile 375 (sr-only span and toast look
  identical); `/alerts/manage` still HTTP 200 with zero app-console errors and
  zero horizontal overflow.
- `npx tsc --noEmit` and `npx next build` both clean.

## Out of scope
- Any copy/visual change to rows, the toast, or status pills.
- Focusing a specific "next row" after delete (the Undo toast is the correct,
  simpler target; the row content is gone client-side).
- The `/alerts/status` confirmation flow (already shipped) or any schema change.
- New capture points / PostHog events (this is pure a11y polish).
