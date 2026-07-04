# Spec: seeker-description-surface

## Goal
Surface the seeker post form's Description field as its own always-visible section (matching the aircraft and partnership forms), instead of burying it inside the collapsed "More details" `<details>`.

## Scope
- `src/components/PostSeekerListingForm.tsx` only:
  - Move the existing "Description" block (tips box + textarea, currently ~lines 707-742, nested inside the "More details" `<details>`) out into its own standalone `<section>` placed between "The basics" section and the "More details" `<details>` — matching the exact layout/copy pattern already used in `PostAircraftForm.tsx` ("About this aircraft") and `PostPartnershipForm.tsx` ("About this partnership"): `rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6` wrapper, raw `<h2>` header + one-line supporting copy, then the identical tips-box/examples `<details>` + `<textarea name="description">`.
  - Header copy: "About you" / a one-line intro sentence consistent with the form's existing "Tell owners about yourself…" placeholder copy.
  - Remove `initialValues?.description` from the "More details" `<details>` `open={...}` condition (it no longer lives in that section, so it shouldn't force it open).
  - Remove `result.description` from the AI-prefill `hasMoreDetails` check (same reasoning — description moving out means it no longer needs to force-open "More details").
- No changes to `src/app/actions.ts`, no schema change, no change to the `description` field's `name` attribute or server handling — pure JSX relocation + copy.

## Acceptance criteria
- On `/partnerships/seeking/new` (fresh, logged-out or logged-in, no draft), the Description field with its tips box is visible without clicking "More details."
- "More details" still contains Aircraft Preferences, Partnership Preferences, and Contact Information, and its collapse/expand behavior for those fields is unchanged.
- AI "Prefill from your notes ✨" still fills the description textarea correctly (now in its new location) and still expands "More details" when it fills any field that remains inside it.
- Edit mode (`/partnerships/seeking/[id]/edit`) still shows the existing description prefilled in the new section location.
- `npx next build` passes (typecheck + build).
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at desktop 1280 + mobile 375 on `/partnerships/seeking/new`.

## Out of scope
- No changes to the aircraft or partnership post forms (already correct).
- No changes to validation, required-ness, or the description's placement relative to contact info.
- No changes to `contact_phone`/`contact_email` required-ness (a separate, previously-identified Pillar 3-ish gap, not this cycle's scope).
