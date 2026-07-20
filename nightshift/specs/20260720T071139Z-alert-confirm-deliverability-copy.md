# alert-confirm-deliverability-copy

## Goal
Add one quiet, honest deliverability nudge to the double-opt-in alert confirm email so subscribers who are provably reading us in their inbox are asked to whitelist/move us to Primary — closing the GOAL.md ask that "the double-opt-in email itself" be excellent.

## Scope
- `src/lib/email.ts` — `buildAlertConfirmEmail()`: add one line under the "Confirm my alerts" CTA button, in both `html` and `text`.
- `src/lib/email.test.ts` — new test(s) asserting the line renders in both html/text and doesn't break the existing preview/no-preview tests.

## Acceptance criteria
- The confirm email (HTML) renders a single new sentence below the "Confirm my alerts" button, above (or in place of) the existing "Didn't request this?" line, along the lines of: "Can't find our emails later? Drag this one to your Primary tab or add us to your contacts so your alerts always arrive."
- The text version carries the equivalent line.
- No new links, no images, no schema/DB change, no new capture point.
- Existing `buildAlertConfirmEmail` tests (preview / no-preview / zero-match) still pass unchanged.
- `npx next build` + `tsc --noEmit` pass; full `node --test` suite passes.
- QA: non-visual cycle (email-builder copy only, no page markup) — smoke gate on `/alerts` + `/aircraft` is sufficient; screenshots saved but not read.

## Out of scope
- Any other email template (digest, price-drop, manage-link, etc).
- The other two queued `[P2][goal]` items (re-permission lifecycle block on `/admin/alerts`; daily capture-funnel self-check) — separate cycles.
