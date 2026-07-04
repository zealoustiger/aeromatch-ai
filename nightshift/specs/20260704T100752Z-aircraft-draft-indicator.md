# aircraft-draft-indicator

## Goal
Bring `/aircraft/new`'s (and its edit form's) autosave-status indicator to parity with the shared `DraftIndicator` component already shipped on the partnership and seeker post forms, so aircraft sellers get the same "Saving…" / "Draft restored — picking up where you left off" feedback.

## Scope
- `src/components/PostAircraftForm.tsx` only:
  - Add the `DraftIndicator` function (copied verbatim from `PostPartnershipForm.tsx`/`PostSeekerListingForm.tsx`).
  - Import `Check` icon and `type DraftStatus` from `useFormDraft`.
  - Replace the bare `<span>` at the draft-status row (~line 403-405) with `<DraftIndicator status={status} />`.

## Acceptance criteria
- `/aircraft/new`: typing in a field shows "Saving…" (spinner) then "Draft saved" (check), same timing/behavior as the partnership form.
- Reloading `/aircraft/new` with an existing localStorage draft shows "Draft restored — picking up where you left off" instead of generic "Draft saved".
- The draft-status text has `aria-live="polite"` (screen-reader announced), matching the other two forms.
- No change to `useFormDraft` hook, actions, or any other component — purely presentational, additive.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke passes on `/aircraft/new` and `/aircraft/listing/[id]/edit` at desktop 1280 + mobile 375 (HTTP 200, zero console errors, zero horizontal overflow).

## Out of scope
- Any change to the partnership or seeker forms (already correct).
- The other two runner-up candidates found during audit (N-number helper "Optional" wording, photo-upload endpoint prop) — not pursued, lower value.
