# seeker-scheduling-field

## Goal
Fix a live data-integrity bug on the seeker post/edit form: `createSeekerListing`/
`updateSeekerListing` have always written `preferred_scheduling` from form data, but no
input for it exists on `PostSeekerListingForm.tsx` — so every create nulls it and every
edit silently erases any existing value back to null. Add the missing field (same class
of bug just fixed on the partnership form in `partnership-requirements-fields`).

## Scope
- `src/components/PostSeekerListingForm.tsx` — add a `preferred_scheduling` text input
  in the "Partnership Preferences" section (next to "Preferred Share Types"), add it to
  the `SeekerEditInitial` type, and add it to the "More details" auto-open condition.
- `src/app/partnerships/seeking/[id]/edit/page.tsx` — add `preferred_scheduling` to the
  `.select()` column list and to `initialValues` so edit mode prefills the saved value.
- No server action changes needed — `createSeekerListing`/`updateSeekerListing` already
  read `formData.get('preferred_scheduling')`; no schema change needed — the column
  already exists in the base `partnership_seekers` table (`supabase/schema.sql:223`,
  not a pending migration).

## Acceptance criteria
- `/partnerships/seeking/new` shows a "Preferred Scheduling" text input (optional,
  free text, e.g. "flexible", "weekday mornings").
- Submitting the seeker form with a scheduling preference saves it; the detail page
  (`/partnerships/seeking/[id]`) already renders it when present (no change needed there).
- Editing an existing seeking listing that has a saved `preferred_scheduling` value shows
  it pre-filled in the edit form, and saving the edit WITHOUT touching that field no
  longer erases it to null.
- `npx next build` + `tsc --noEmit` pass clean.
- QA smoke passes at desktop 1280 + mobile 375 on `/partnerships/seeking/new` (zero
  console errors, zero horizontal overflow, HTTP 200).

## Out of scope
- Extending the AI draft ("Prefill from your notes") to extract `preferred_scheduling` —
  a separate slice, same shape as the earlier `seeker-ai-draft-share-use` cycle.
- Any change to the aircraft-for-sale form (audited this cycle — no equivalent bug found).
