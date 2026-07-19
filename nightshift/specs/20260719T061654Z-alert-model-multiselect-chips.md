# Spec: multi-model chips on the aircraft alert edit form

## Goal
Let a subscriber editing an aircraft alert's Model field pick/remove models via the
same variant-grouped checkbox chips `/aircraft` browse filters use, instead of hand-
editing a comma-separated text string.

## Scope
- `src/components/AlertEditForm.tsx` — replace the bare Model `<input>` with a
  chip-based multi-select for `target.type === 'aircraft'` only (mirrors
  `AircraftSaleFilters.tsx`'s Model block: `groupModelVariants`, singleton
  checkboxes, grouped rows with a "(all)" parent + "Show N variants" disclosure).
  Local `model` state (already a comma string) is written the same way; falls back
  to today's plain text input when the make isn't in the facets set (unknown/free-
  typed make, or facets failed to load).
- `src/app/alerts/manage/page.tsx` — fetch `getAircraftFacets()` once, pass as a new
  `facets` prop into `AlertEditForm`.
- `AlertEditForm`'s `Props` interface — add `facets?: AircraftFacets`.

## Out of scope
- Partnership alerts (no Model field today — untouched) and seeker alerts (stay on
  the plain text input — no facets source fits pilot-seeking preferred models).
- Any new capture-point analytics event, schema change, or the `NewAlertForm`
  creation form (only the *edit* form on `/alerts/manage`).
- Reworking `AircraftSaleFilters.tsx` itself.

## Acceptance criteria
- On `/alerts/manage`, opening Edit on a `type=aircraft` alert whose `make` matches
  a known facet make renders the Model field as checkboxes (grouped for variant
  families) instead of a text input; the alert's current comma-joined models are
  pre-checked.
- Toggling a chip updates the same local `model` state that's already wired into
  `handleSubmit`/the live-match-count preview — no new state plumbing, no wire-
  format change (`Save changes` still writes a comma-joined string).
- A group's parent "(all)" checkbox shows correct checked/indeterminate state and
  toggles every member; "Show N variants" discloses individual members.
- When `make` doesn't match any facet make (blank, free-typed, or unrecognized),
  the field falls back to the existing plain text input — never blocks editing.
- Partnership and seeker alert edit rows render exactly as before (no regression).
- `npx tsc --noEmit` and `npx next build` pass; QA smoke on `/alerts/manage` clean
  at desktop 1280 + mobile 375, no new console errors.
