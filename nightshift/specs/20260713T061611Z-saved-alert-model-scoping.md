# saved-alert-model-scoping

## Goal
Sharpen the `/saved` page's suggested alert from make-only ("new Cessna listings") to
model-level ("new Cessna 172 listings") when a visitor's saves genuinely cluster on one
model within the winning make, falling back to make-level (then generic) exactly as today.

## Scope
- `src/lib/savedAlertContext.ts` — `deriveSavedAlertContext`: after picking the unambiguous
  top make (unchanged logic), also look for an unambiguous top model *within that make's
  items of the winning noun* (same plurality + tie-breaking rules as the make pass — no
  new heuristic). When found, name it (`"Cessna 172"`) and route `sourcePath` with both
  `make` and `model` query params; otherwise keep today's make-only context/path.
- New `src/lib/savedAlertContext.test.ts` — unit coverage for the model-clustering case,
  the tie-at-model-level fallback case, and the pre-existing make-level cases (regression).
- No changes to `src/app/saved/page.tsx` or `src/components/DeviceSavedListings.tsx` — both
  already just render whatever `SavedAlertContext` returns.

## Acceptance criteria
- All saves in the winning make share one model → `context` becomes `"{make} {model}"` and
  `sourcePath` is `/aircraft?make=...&model=...` (or `/partnerships?...`) with both params.
- Saves in the winning make split across 2+ models with no plurality (tie) → falls back to
  make-only context/path, same as before this change.
- A make with only saves that have no `model` value → falls back to make-only (unchanged).
- Existing make-level tie-breaking (e.g. 1 Cessna + 1 Piper → generic fallback) is untouched.
- `alert_subscribed` payload shape / `source` values (`saved_page`, `saved_page_device`)
  unchanged — this only sharpens `context`/`sourcePath`, not the capture mechanism.
- `npx next build` + typecheck clean; new unit tests pass.

## Out of scope
- Snooze / pause-until (separate backlog item, needs a schema migration).
- Any change to the partnership/seeker save-alert exclusion (seekers stay excluded).
- Model-level scoping for any other `AlertSignup` capture point (this is `/saved`-only).
