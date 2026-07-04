# draft-resume-banner-edit-mode

## Goal
Extend the site-wide `DraftResumeBanner` (Pillar 1: frictionless posting) to also detect
in-progress **edit-mode** drafts (`ch:draft:{aircraft|partnership|seeker}-edit:{id}`), not
just "new listing" drafts — so a poster who edits a published listing, autosaves a change,
and navigates away still has a way back.

## Scope
- `src/components/DraftResumeBanner.tsx` — replace the fixed `DRAFT_TYPES` key list with a
  scan of `localStorage` keys matching both the existing "new" keys and the edit-mode pattern
  `ch:draft:(aircraft|partnership|seeker)-edit:(.+)`, mapping the matched type+id to the
  correct edit href (`/aircraft/listing/{id}/edit`, `/partnerships/{id}/edit`,
  `/partnerships/seeking/{id}/edit`).
- No changes to `useFormDraft.ts` or any post/edit form — they already write these keys.
- No schema/DB change.

## Acceptance criteria
1. Autosaving a change on `/aircraft/listing/{id}/edit` (or partnership/seeker edit), then
   navigating to another page (e.g. `/listings`), shows the resume banner linking back to
   that specific listing's edit page.
2. Visiting the edit page itself while its own draft exists does NOT show the banner
   (self-suppression, matching existing "new draft" behavior).
3. If both a "new" draft and an "edit" draft exist simultaneously, exactly one banner shows
   (no crash, no duplicate banners).
4. Dismissing the banner still works per session (existing behavior preserved) and no draft
   present shows nothing.
5. `npx next build` + typecheck stay clean; no new console errors or horizontal overflow at
   desktop 1280 / mobile 375 on `/listings`, `/aircraft/new`, and a real edit page.

## Out of scope
- Any change to auth/signup gating (Pillar 2).
- Any change to buyer-analysis modules (Pillar 3).
- Restructuring `useFormDraft` itself or the post forms.
