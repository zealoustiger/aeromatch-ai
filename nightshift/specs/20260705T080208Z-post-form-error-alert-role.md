# post-form-error-alert-role

## Goal
Make the submission-failure error message on all 3 post forms (aircraft, partnership,
seeker) announce itself to screen readers, matching the accessible treatment the
same files already give the much-lower-stakes "Draft saved" status.

## Scope
- `src/components/PostAircraftForm.tsx` (~line 743)
- `src/components/PostPartnershipForm.tsx` (~line 929)
- `src/components/PostSeekerListingForm.tsx` (~line 825)

Each has the identical pattern:
```jsx
{state && !state.ok && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {state.error ?? 'Something went wrong. Please try again.'}
  </div>
)}
```
Add `role="alert"` to each of the 3 divs (one attribute per file). `role="alert"` is
an implicit live region (assertive), so no separate `aria-live` attribute is needed.

## Acceptance criteria
- All 3 post forms' error `<div>` has `role="alert"`.
- `npx next build` + typecheck pass clean.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop
  1280 + mobile 375 on `/aircraft/new`, `/partnerships/new`, `/partnerships/seeking/new`.
- No visual change (the attribute has no effect on layout/rendering) — verified by
  curling rendered HTML for the `role="alert"` string rather than reading screenshots.
- No change to validation logic, error copy, or server actions — purely an
  accessibility attribute addition.

## Out of scope
- Rewriting the error copy or validation logic itself.
- The runner-up candidate (adding `autoComplete` hints to contact fields) — separate,
  future slice.
- The `DraftIndicator`'s existing `aria-live="polite"` spans — already correct, untouched.
