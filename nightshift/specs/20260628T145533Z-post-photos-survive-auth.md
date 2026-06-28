# Spec — Aircraft post photos survive the auth redirect / reload

**Slug:** `post-photos-survive-auth`
**Pillar:** 1 — Frictionless listing posting
**Backlog item:** `[P1][goal] Autosave the draft (localStorage) + restore — "A half-filled form must survive a reload or the auth redirect — never lose someone's typing. Pairs with Pillar 2's deferred gate (post first, sign in to publish, draft intact)."`

## Goal
When a logged-out seller uploads photos on `/aircraft/new` and then clicks "Sign in to Publish", their already-uploaded photos survive the auth round-trip (and any page reload) instead of silently vanishing.

## The friction / loss being removed
The post form's autosave (`useFormDraft` + `forceSaveDraft`) persists every named **text** field across the auth redirect, but **photos are lost**: the uploaded URLs live in `PartnershipPhotoUpload`'s React state and are emitted as **hidden** `photo_url` inputs, which `forceSaveDraft`/`useFormDraft` deliberately skip. So a logged-out poster who uploads up to 5 photos (the form literally calls photos "the highest-value element of a listing") and signs in to publish returns to an empty uploader — the single most valuable thing they added is gone. The photos are already uploaded to storage with public URLs **before** submit, so nothing needs re-uploading — only the URLs need to persist + restore.

## Scope (small)
- `src/components/PartnershipPhotoUpload.tsx` — add two **opt-in** props:
  - `persistKey?: string` — when set, mirror the successfully-uploaded photo URLs to `localStorage[persistKey]` whenever they change, and restore them into state on mount.
  - `restoreGateKey?: string` — only restore the persisted photos when `localStorage[restoreGateKey]` exists (the form's text-draft key). Ties photo lifetime to the text-draft lifetime so photos restore exactly when the draft does, and are cleared (key removed, no restore) when there is no draft.
- `src/components/PostAircraftForm.tsx` — pass `persistKey={DRAFT_KEY + ':photos'}` and `restoreGateKey={DRAFT_KEY}` to the uploader; on "Start over", remove the photos key and remount the uploader (via a bumped React `key`) so its thumbnails clear too.

## Acceptance criteria
- [ ] `PartnershipPhotoUpload` with **no** new props behaves exactly as today (partnership/seeker forms unaffected).
- [ ] On `/aircraft/new`, uploading photos then triggering the logged-out "Sign in to Publish" redirect and returning restores the same photos (URLs) into the uploader, and they submit with the listing.
- [ ] A plain page reload mid-fill (with a text draft present) restores the photos too.
- [ ] After a successful publish (text draft cleared), returning to `/aircraft/new` shows an **empty** uploader — no stale photos from the prior listing.
- [ ] "Start over" clears the photo thumbnails and the persisted photos key.
- [ ] `npx next build` + typecheck pass; QA smoke (HTTP 200 / no app console errors / no horizontal overflow at 1280 + 375) passes on `/aircraft/new`.

## Out of scope
- The partnership post form (`/partnerships/new`) — identical gap, same shared component; left as the next slice for parity (mirrors the prior aircraft-then-partnership slicing rhythm). It passes neither new prop, so it is unchanged this cycle.
- Persisting the raw image bytes / re-uploading; persisting the "Prefill from your notes" textarea (no `name`, separate concern).
- Any change to upload endpoints, storage, or the submit/data model.
