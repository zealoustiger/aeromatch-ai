# Spec — draft-start-over

## Goal
Give every "Post a…" form a one-click **"Start over"** control so a returning user
whose autosaved draft was restored can clear it and start fresh (e.g. to list a
different aircraft) without manually wiping each field.

## Why (Pillar 1 — frictionless posting)
Autosave + restore already works (`useFormDraft`). But a restored draft is a dead
end if it's the *wrong* draft: the user must delete every field by hand to begin a
new listing. That's exactly the kind of step/decision friction the posting pillar
targets. A guarded "Start over" closes it. Pairs with the existing restore flow.

## Scope (small)
- `src/components/useFormDraft.ts` — add a `reset()` callback (native `form.reset()`
  + clear localStorage + status → idle + drop the failed-submit snapshot/timer),
  and return it.
- `src/components/PostAircraftForm.tsx` — render a guarded "Start over" button next
  to the draft indicator when a draft exists.
- `src/components/PostPartnershipForm.tsx` — same.
- `src/components/PostSeekerListingForm.tsx` — same.

## Acceptance criteria
- [ ] `useFormDraft` exposes `reset()`; it clears the form fields, removes the
      localStorage key, and sets status back to idle (no autosave re-fires).
- [ ] On all three post forms, a "Start over" control appears only when there is a
      draft (status is `saved` or `restored`) and is hidden otherwise.
- [ ] Clicking "Start over" prompts a confirm (guard against accidental data loss),
      and on confirm empties the visible fields and clears the saved draft.
- [ ] The button is `type="button"` (never submits the form) and does not regress
      the existing autosave / restore / failed-submit-recovery behavior.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors /
      no horizontal overflow at 1280 + 375) passes for all three form pages.

## Out of scope
- The AI prefill, FAA lookup, photo upload, and submit/auth-gate flows (untouched).
- Clearing uploaded photos on Start over (photos aren't part of the text draft).
- Any change to what fields are required or how the action saves.
