# photo-mid-upload-recovery

## Goal
Recover a photo whose upload request was interrupted by a reload or in-app navigation while it was still in flight, instead of silently losing the raw file (Pillar 2 — frictionless signup/auth; the same "never lose real work" principle already applied to text drafts and successfully-uploaded photo URLs).

## Context (from scoping)
`PartnershipPhotoUpload.tsx` (shared by the aircraft and partnership post/edit forms) already persists successfully-uploaded photo URLs to `localStorage[persistKey]` so they survive a reload or the deferred-auth redirect. But while a photo is mid-upload (`uploading: true`, only an in-memory `File` + blob-URL preview, request in flight to `/api/upload-*-photo`), a reload or route navigation in that ~1-3s window loses the raw file entirely — the entry never makes it into the persisted URL list. This is a narrow but real gap flagged in two prior CHANGELOG entries (`photo-upload-signin-redirect`, `launch-banner-honest-stats`).

Note: it does NOT affect the classic "add a photo while logged out" path — `addFiles()` already checks `isLoggedIn` before creating any entry or touching the file, so nothing is created to lose in that case. The gap is specifically the in-flight-upload race.

## Scope
- New `src/lib/idbPhotoDraft.ts` — a tiny IndexedDB-backed store keyed by the same `persistKey` convention already used for photo URLs: `savePendingPhoto`, `deletePendingPhoto`, `listPendingPhotos`, `clearPendingPhotos`. All operations are best-effort (feature-detect `indexedDB`, catch/ignore all errors) — if IndexedDB is unavailable, behavior degrades to exactly today's (file lost on interruption), no crash, no regression.
- `src/components/PartnershipPhotoUpload.tsx`:
  - Save the raw `File` to IndexedDB the moment an upload starts; delete it once that upload settles (success or failure) — mirrors the existing "persist URLs as they succeed" pattern.
  - On mount (gated identically to the existing URL restore — only when `restoreGateKey`'s draft is present), check for any leftover pending file(s) from an interrupted session and resume their upload automatically, reusing the same upload path.
  - When the gate says the draft is gone (already-existing branch that clears the persisted URL list), also clear any leftover pending IndexedDB entries for that key.
- No changes to `PostAircraftForm.tsx` / `PostPartnershipForm.tsx` — they don't need to know about this; the existing `persistKey`/`restoreGateKey` props already flow through.
- No schema/server-action change. Seeker form is out of scope (no photo field).

## Acceptance criteria
- `npx next build` + typecheck clean.
- Start uploading a photo, then reload the page (or navigate away and back) before the upload request resolves: on return, the photo automatically resumes uploading (shown as an "uploading" thumbnail) rather than disappearing.
- A normal, uninterrupted upload behaves exactly as before (no visible change, no duplicate save calls after it completes — the pending record is deleted once the upload settles).
- "Start over" still fully clears photos, including any leftover pending IndexedDB record (no orphaned recovery on next visit).
- No new console errors on `/aircraft/new`, `/aircraft/listing/[id]/edit`, `/partnerships/new`, `/partnerships/[id]/edit` at desktop 1280 + mobile 375.
- If IndexedDB is unavailable/blocked, the uploader still works exactly as it does today (no crash, no thrown error surfaced to the user).

## Out of scope
- Persisting anything beyond a single mid-flight file (already-uploaded URLs and text fields already persist via existing mechanisms).
- Any change to the seeker post form (no photo upload there).
- A "retry" UI for hard upload failures (unrelated to this recovery path).
