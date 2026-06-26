# Spec: saved-listing-note

**Goal:** Let users attach an optional free-text note to any saved listing so they can remember why they saved it ("great panel — ask about damage history").

**Scope:**
- `supabase/schema.sql` — additive migration: `alter table saved_listings add column if not exists note text`
- `src/app/actions.ts` — new `updateSavedNote(savedRowId, note)` server action (owner-scoped)
- `src/app/saved/page.tsx` — select `id` + `note` from saved_listings; pass both to a new NoteEditor component below each card
- `src/components/SavedListingNote.tsx` — new client component: shows "＋ Add a note" when empty; click → inline textarea → Save/Cancel; renders note text + pencil edit affordance when populated; empty string on save removes the note
- Apply the DB migration inline via a Node.js script before build

**Acceptance criteria:**
1. `/saved` page returns HTTP 200 with no app-origin console errors
2. Each saved listing shows a "+ Add a note" affordance (or the existing note if set)
3. Clicking the affordance opens an inline textarea at the card's bottom
4. Typing and clicking Save persists the note (page re-render shows it)
5. Clicking the pencil on an existing note re-opens the editor; clearing + saving removes it
6. Layout is clean at desktop 1280 and mobile 375px — no overflow, no broken layout
7. Auth-gated: the `/saved` page is only meaningful for logged-in users (existing behaviour unchanged)

**Out of scope:**
- Rendering the note on the listing detail page (slice 3 — follow-up cycle)
- Rendering the note on listing cards in browse views
- Partnership or aircraft save-note UI on the Save button itself (that would require restructuring the SaveButton → deferred)
- No-schema-change fallback path (the migration runs before build; smoke hits the real DB)
