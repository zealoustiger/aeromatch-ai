# Spec: saved-note-on-listing-detail

**Timestamp:** 2026-06-25T090027Z  
**Slug:** saved-note-on-listing-detail  
**Lane:** [want] — P2[want] "Optional note when saving a listing" — slice 3

## Goal

Render the user's saved-listing note on `/aircraft/listing/[id]` when they've saved this
aircraft with a note. Completes the "Optional note when saving a listing" backlog item
(slice 1+2 shipped in `saved-listing-note` for `/saved`; this is the detail-page view).
Also correctly sets `initialSaved` instead of the hardcoded `false`, eliminating the
heart-state flash for logged-in users who have already saved the listing.

## Scope

- `src/app/aircraft/listing/[id]/page.tsx` — server-side saved-row fetch + pass
  `initialSaved` + render `SavedListingNote` when saved. One file.

## Acceptance criteria

1. A logged-in user who has previously saved this aircraft sees `initialSaved={true}` on
   the `SaveListingButton` — no heart-state flash on page load.
2. When the `note` column exists and the user has saved the listing: a `SavedListingNote`
   editor renders below the Save/Share button row (same amber sticky-note UI as on `/saved`).
3. When the user has NOT saved the listing: no note affordance shown (note is only
   meaningful after saving).
4. When the `note` column hasn't been migrated yet (42703 error): fall back gracefully —
   still show correct `initialSaved`, just suppress the note UI (`notesEnabled = false`).
5. Logged-out users: `initialSaved={false}`, no note — identical to current behavior.
6. `npx next build` clean, typecheck passes, smoke exits 0 on `/aircraft/listing/[id]`
   at desktop 1280 + mobile 375.

## Out of scope

- Partnership detail page note (follow-up)
- Browse card note display
- Inline-on-save variant (needs SaveButton restructuring — separate cycle)
- The pending DB migration (human applies; feature self-suppresses until then)
