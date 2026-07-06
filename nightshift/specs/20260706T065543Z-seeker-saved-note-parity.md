# seeker-saved-note-parity

## Goal
Bring the "optional note on a saved listing" feature to the seeker (pilot-seeking-a-partnership)
detail page — the one of the 3 listing types that never got it, even though the note editor
component, server action, and `/saved` page display were all already built listing-type-agnostic.

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx`:
  - Extend the existing `saved_listings` lookup (currently `select('id')` only) to the same
    with-note / fallback-without-note pattern already used on the aircraft and partnership
    detail pages (`select('id, note')`, catch a missing-column error, retry with `select('id')`).
  - Import and render `SavedListingNote` next to `SaveListingButton` in the header, gated on
    `notesEnabled && savedRowId`, mirroring the partnership detail page's layout (wrap the
    save button + note editor in a `flex-col items-end gap-2` container).
- No changes to `SavedListingNote.tsx`, `updateSavedNote` action, or `/saved/page.tsx` — all
  already listing-type-agnostic and already exercise this exact code path for aircraft/partnership.
- No schema change (the `note` column and its fallback-on-missing-column handling already exist).

## Acceptance criteria
- `/partnerships/seeking/[id]` fetches `note` alongside `id` from `saved_listings` when the
  visitor is signed in, with the same graceful fallback to `id`-only on a missing-column error.
- When a signed-in visitor has saved the listing, the note editor renders in the header next to
  the Save button (same visual treatment as the aircraft/partnership detail pages).
- When the visitor hasn't saved the listing, or the note column isn't migrated yet, or the
  visitor is logged out, nothing new renders (no regression to the existing Save button).
- `npx next build` + typecheck clean.
- QA smoke passes on `/partnerships/seeking` + a real seeker listing detail page at desktop 1280
  + mobile 375 (HTTP 200, zero console errors, zero horizontal overflow).

## Out of scope
- Any change to the `note` column/schema.
- Porting notes to any other page.
- The seeker page's own trust/budget/cost panels (untouched).
