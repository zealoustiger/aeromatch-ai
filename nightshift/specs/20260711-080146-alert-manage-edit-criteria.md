# alert-manage-edit-criteria

## Goal
Let a signed-in user edit an existing alert's match criteria (make/model/state/price
range) inline on `/alerts/manage` instead of having to delete and re-create it.

## Scope
- `src/lib/alertEditCriteria.ts` (new) — shared parse/build helpers: parse a
  `source_path` into pre-fillable editable fields, and rebuild `source_path` +
  `context` from edited fields. Deliberately scoped to the "modern query-string
  shape" (`/aircraft?...`, `/partnerships?...`, `/partnerships/seeking?...`) — the
  only shape every current capture point produces and the only shape that
  round-trips losslessly through a flat form. Mirrors (does not import — route file
  vs. action file boundary) the relevant branch of `parseSourcePath` in
  `src/app/api/cron/alert-digest/route.ts`, which is NOT modified this cycle.
- `src/app/actions.ts` — new `updateAlertCriteria(id, fields)` server action, same
  `loadOwnedAlert` ownership pattern as `pauseAlert`/`resumeAlert`/`deleteAlert`;
  extend `loadOwnedAlert`'s select to include `source_path`.
- `src/components/AlertEditForm.tsx` (new, client) — renders the View link +
  existing `AlertActions` (Pause/Resume/Delete, unchanged) + a new Edit toggle;
  toggling opens an inline form pre-filled from the parsed criteria, submits via
  `updateAlertCriteria`, shows a dismissible confirmation toast on success.
- `src/app/alerts/manage/page.tsx` — parse each row's `source_path` server-side via
  `parseEditableAlertTarget`, swap the old inline View-link/`AlertActions` markup
  for `<AlertEditForm>`.
- `src/components/AlertActions.tsx` — unchanged (composed inside `AlertEditForm`).

## Acceptance criteria
- On `/alerts/manage`, a signed-in user's alert whose `source_path` is one of
  `/aircraft(?...)`, `/partnerships(?...)`, `/partnerships/seeking(?...)` shows an
  "Edit" action that expands a form pre-filled with its current make/model/state/
  price range (aircraft), make/state/airport (partnership), or make/model (seeker).
- Saving the form calls an owner-scoped server action that rebuilds `source_path`
  (canonical query-string shape) and `context`, updates only that row, and leaves
  every other field (`status`, `created_at`, `confirmed_at`, tokens) untouched.
- A successful save shows a confirmation toast, closes the form, and the row's
  displayed context / "View" link reflect the new criteria without a full page
  navigation.
- An alert whose `source_path` is null or an unrecognized/legacy shape (e.g.
  `/aircraft/cessna/172`, `/aircraft/mission/...`) shows no Edit button and is
  otherwise unaffected (Pause/Resume/Delete/View still work).
- Editing never silently drops a query param the form doesn't expose (e.g. an
  aircraft alert's `min_year`/`max_tt`, if present, survives an edit that only
  touches make/model/state/price).
- `npx next build` passes (typecheck + build) and the QA smoke gate passes at
  desktop 1280 + mobile 375 with zero app-origin console errors and zero
  horizontal overflow on `/alerts/manage`.

## Out of scope
- Price-drop alerts, frequency/digest-vs-instant, alert-type toggles — separate
  backlog items.
- Editing legacy path-segment SEO alerts (`/aircraft/[make]/[model]`, etc.) — out
  of scope; those rely on curated `modelPattern`/`notModelPattern` matching that
  doesn't round-trip through a flat make/model field.
- Any change to `alert-digest/route.ts`'s `parseSourcePath` or the digest cron
  itself.
- Any schema/migration change.
