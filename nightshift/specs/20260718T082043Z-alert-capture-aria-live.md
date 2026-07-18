# Spec: Screen-reader pass on alert capture components

## Goal
Make the async state swaps in the three shared alert-capture components (success
confirmation, error, email-typo suggestion, sticky-bar "alerts on") announce to
assistive tech via `role="status"`/`role="alert"`/`aria-live="polite"`, instead of
being silent DOM swaps.

## Scope
- `src/components/AlertSignup.tsx` — the 4 post-submit/existing-alert info panels,
  the error paragraph, the "Did you mean {email}?" suggestion.
- `src/components/FooterAlertCapture.tsx` — the submitted/locallySubscribed panels,
  the error paragraph, the email-typo suggestion.
- `src/components/MobileStickyAlertBar.tsx` — the justSubscribed/justOneTapSubscribed
  "alerts on" swap, the pending/error button label.
- Quick label/association audit of the email inputs in all three (expected to
  already be fine — confirm, don't change unless actually missing).

## Acceptance criteria
- Every success/confirmation panel in the 3 components has `role="status"
  aria-live="polite"` so a screen reader announces it when it replaces the form.
- Every inline error message has `role="alert"` (assertive, so it interrupts).
- The "Did you mean {email}?" typo-suggestion in `AlertSignup`/`FooterAlertCapture`
  is wrapped so its appearance is announced (`aria-live="polite"`).
- The sticky bar's "alerts on"/pending/"try again" swap is announced.
- Every email `<input>` still has a properly associated `<label>` (sr-only is fine).
- `npx next build` + typecheck pass; no new console errors; no visual regression
  (pure `aria-*`/`role` attribute additions, no className/layout changes).

## Out of scope
- The `AlertEditForm`/other manage-page components not named in the backlog item.
- Any new capture point, analytics event, or copy change.
- The blocked P1 items (instant-send cron, "Save this search" auth-wall product
  call) — untouched.
