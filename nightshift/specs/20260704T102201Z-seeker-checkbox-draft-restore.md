# seeker-checkbox-draft-restore

## Goal
Fix the shared form-draft system (`useFormDraft.ts`, and the triplicated `forceSaveDraft`
helper in all 3 post forms) so checkbox/radio selections survive autosave/restore —
closing a real Pillar 2 (frictionless signup) data-loss gap where a logged-out seeker's
"Intended Use" / "Preferred Share Type" checkbox picks are silently dropped across the
`/auth?next=...` sign-in redirect (and even a plain page reload).

## Scope
- `src/components/useFormDraft.ts` — widen `isDraftable`/`readForm`/`writeForm` to capture
  checked checkbox/radio values (as `string[]` per input name) instead of excluding them
  entirely; dispatch a bubbling `change` event when restoring a checked box so the seeker
  form's existing hidden-input sync script (`syncCheckboxes`) re-runs, mirroring the pattern
  already used by `fillCheckboxGroup`'s AI-draft restore. Export the read helper so the 3
  post forms can share one implementation instead of duplicating it.
- `src/components/PostSeekerListingForm.tsx`, `PostPartnershipForm.tsx`,
  `PostAircraftForm.tsx` — replace each file's local `forceSaveDraft` duplicate (identical
  exclusion list in all 3) with the shared exported helper.
- No schema change, no server-action change, no auth-file change (all touched files are
  outside `FREEZE.md`'s auth list).

## Acceptance criteria
- On `/partnerships/seeking/new` while logged out: check one or more "Intended Use" and
  "Preferred Share Type" boxes, then trigger the auth redirect (e.g. click "Sign in to
  Publish"). Confirm the draft saved to `localStorage` under the seeker draft key now
  includes those checkbox values (previously entirely absent).
- Simulate the restore (reload the page with that draft present, or directly call the
  restore path): the same boxes come back checked, and the hidden
  `intended_use`/`preferred_share_types` inputs the server action reads are correctly
  populated (not empty) — verified via the existing `syncCheckboxes` re-sync firing.
- `/aircraft/listing/[id]/edit`'s `clear_home_airport` single checkbox (the only other raw
  checkbox in any of the 3 forms) still round-trips correctly through autosave (this is a
  general fix to shared code, not seeker-only).
- All other existing draft behavior (text/select/textarea fields, "Saving…"/"Draft saved"/
  "Draft restored" indicator, Start Over) is unchanged — no regression.
- `npx tsc --noEmit` and `npx next build` both pass clean.
- QA smoke passes on `/partnerships/seeking/new`, `/partnerships/new`, `/aircraft/new` at
  desktop 1280 + mobile 375 (HTTP 200, zero app-origin console errors, zero overflow).

## Out of scope
- Any change to `src/app/auth/**` or the OAuth/magic-link flow itself.
- Persisting the raw photo file across the auth redirect (separate, already-noted gap).
- Adding new checkbox-based UI to the aircraft/partnership forms (they use CSV-text chip
  toggles today, not raw checkboxes) — this cycle only fixes the shared draft mechanism so
  it doesn't silently drop data if/when it's used.
