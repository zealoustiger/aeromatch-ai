# Spec — photo-upload-persistent-drop-paste

## Goal
Make adding photos to a post form a non-event: drag-drop should work the *whole
time* (not only on the empty form), and you should be able to paste an image from
the clipboard — the named Pillar-1 `[P2][goal]` "drag-drop + paste + multi-file"
photo-upload polish item.

## Why (friction removed)
`PartnershipPhotoUpload` (shared by `/aircraft/new` and `/partnerships/new`) only
renders its drag-drop zone when `photos.length === 0`. After the first photo lands,
the zone disappears and the only way to add a 2nd–5th photo is the small "+" tile →
file browser. So drag-drop — the advertised, fastest path — silently stops working
after one photo. This cycle makes the *entire* component a persistent drop target
(works with photos present, up to the 5-photo max) and adds clipboard paste.

## Scope (small)
- `src/components/PartnershipPhotoUpload.tsx` only.
  - Lift the drag handlers to the outer container so a drop anywhere on the
    component adds files whether or not photos already exist.
  - Show a subtle drop-highlight ring on the container while dragging when photos
    are present; keep the existing big empty-state drop zone for the zero-photo case.
  - Add a document-level `paste` listener (mounted with the component) that adds any
    image files from the clipboard — but ignores pastes while a text input/textarea/
    select/contentEditable is focused, so it never hijacks the "Prefill from notes"
    textarea or any other field.
  - Reflect "paste" in the empty-state helper copy.
  - Respect `MAX_PHOTOS` (5) and the per-file slicing already in `addFiles`.

## Acceptance criteria
- [ ] `/aircraft/new` and `/partnerships/new` return HTTP 200 with zero app-origin
      console errors and zero horizontal overflow at desktop 1280 + mobile 375 (QA smoke).
- [ ] The photo section renders correctly in both states: empty (big drop zone) and
      with photos (thumbnails + "+" tile), with no layout breakage on mobile.
- [ ] Drag handlers live on the outer container so the component is a drop target
      regardless of `photos.length` (verified by code + build).
- [ ] A guarded document `paste` listener adds clipboard image files and is removed on
      unmount; it does NOT fire when a text field is focused (no hijack of the AI box).
- [ ] Empty-state copy mentions paste alongside drag/browse.
- [ ] `npx next build` + typecheck pass.

## Out of scope
- No change to upload endpoints, storage, or the form actions.
- No change to MAX_PHOTOS, accepted types, or the 5 MB limit.
- The seeker form (no photo upload) is untouched.
- "Paste & prefill from a source URL" (separate, riskier Pillar-1 item) is NOT in scope.
