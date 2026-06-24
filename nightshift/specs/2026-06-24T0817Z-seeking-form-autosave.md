# Spec — Post-a-Seeking form autosave (seeking-form-autosave)

**Lane:** `[want]` (last non-bug cycle `partnerships-hub-faq-jsonld` pulled `[goal]`; last cycle
PASS so no blocker → `[want]` owed per the 1:1).

**Backlog item:** `[P1][want]` "Post-a-Seeking form: make it frictionless" — **slice 3 (shared
autosave + "Saving…/Saved" indicator)**. Both the `post-partnership-autosave` and
`seeking-description-help` CHANGELOG/BACKLOG notes flag this exact step as the remaining work:
"adopt the same [`useFormDraft`] hook on the Post-a-Seeking form."

## Goal
Make the "Post a Seeking Listing" form (`/partnerships/seeking/new`) autosave the user's progress
to localStorage with a visible "Saving… / Draft saved / Draft restored" indicator, so users don't
fear losing what they typed — reusing the exact hook + indicator already shipped on the partnership
post form (no new infrastructure).

## Scope (small)
- `src/components/PostSeekerListingForm.tsx` — adopt `useFormDraft`:
  - import the hook + a `DraftIndicator` (mirror the partnership form's component/markup verbatim),
  - wire `formRef`, `onSubmit={handleSubmit}`, and a `useEffect` calling `handleResult(state.ok)`,
  - render the indicator row at the top of the form,
  - use a distinct storage key `ch:draft:seeker-new`.

## Acceptance criteria
- [ ] Typing in the form's text/number/select fields shows "Saving…" then "Draft saved".
- [ ] Reloading the page restores the previously-typed values and shows "Draft restored".
- [ ] A successful post clears the draft (no stale restore on the next visit to the form).
- [ ] No new console errors; `next build` + typecheck green.
- [ ] No 375px horizontal overflow; the indicator sits cleanly above the form on mobile + desktop.

## Out of scope
- The still-open field changes for this item (multiple base airports; "willing to travel" →
  drive-time) — those are separate slices.
- Any schema/server-action change (`createSeekerListing` is untouched; client-only).
- Restoring the checkbox groups (intended-use / share-types) — the shared hook deliberately skips
  checkbox + hidden fields, same as the partnership form; the high-value text fields are what's saved.
