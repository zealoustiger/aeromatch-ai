# Spec: partnership-note-on-detail

**Timestamp:** 20260625T091745Z  
**Slug:** partnership-note-on-detail  
**Lane:** [want] (last 3 non-bug: saved-note-on-listing-detail [want], saved-listing-note [want], model-curate-cessna-206 [goal] — not all 3 [want] → [want] owed)

---

## Goal
Render the user's private saved note on the partnership detail page (`/partnerships/[id]`), completing the "Optional note when saving a listing" feature across both listing types.

## Scope
1 file: `src/app/partnerships/[id]/page.tsx`  
- Replace the `isListingSaved()` boolean helper with a `getSavedRow()` function that fetches the `id` + `note` from `saved_listings` (with 42703 graceful fallback when the note column isn't migrated yet)
- Import `SavedListingNote` from `@/components/SavedListingNote`
- Replace `initialSaved={saved}` with `initialSaved={!!savedRowId}`
- Render `<SavedListingNote savedRowId={savedRowId} note={savedNote} />` below the `SaveListingButton` when `notesEnabled && savedRowId`

## Acceptance criteria
1. A user who has saved a partnership listing with a note sees their note displayed below the Save button on the partnership detail page.
2. A user who has saved a partnership listing without a note sees a quiet "Add a note" link below the Save button.
3. A user who has NOT saved the listing sees no note UI (the note only appears for existing saves).
4. The heart/Save button shows the correct filled/unfilled state on first render (no flash), now using the real saved row query instead of the current simple boolean.
5. When the `note` column hasn't been migrated yet (42703 error), the page gracefully suppresses the note UI entirely and still shows the correct save state (id-only fallback).
6. No horizontal overflow or layout breakage at desktop 1280 or mobile 375.

## Out of scope
- Inline-on-save note (needs SaveButton restructuring, deferred)
- Browse card note display (separate slice)
- Aircraft listing detail (already done in `saved-note-on-listing-detail`)
- Deletion of the `backlog-shots/save-note-listing/` screenshot object (waits until all remaining slices land)
