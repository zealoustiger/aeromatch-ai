# Multi-airport criterion inline-editable in alert Edit/Duplicate

## Goal
Replace the single-ICAO-text-field airport input in `/alerts/manage`'s Edit and
Duplicate forms with an add/remove chip field, so a 2+-airport `airports=`
criterion (already supported by the partnership/seeker browse filters) round-trips
through Edit and survives Duplicate instead of being silently dropped or hidden.

## Scope
- `src/lib/alertEditCriteria.ts` — `EditableAlertTarget`'s `partnership`/`seeker`
  variants: `airport: string` → `airports: string[]`. Update
  `parseEditableAlertTarget`, `buildAlertCriteriaUpdate`, `computeWidenCandidate`,
  `targetToFields`, `describeContext`, `EXPOSED_KEYS` accordingly. New local
  `parseAirportCodes` normalizer (mirrors `SeekerFilters.tsx`/
  `PartnershipFilters.tsx`'s existing helper — not extracted to a shared module,
  matching this codebase's existing precedent of small local duplicates for this
  exact function).
- New `src/components/AirportChipsInput.tsx` — small controlled chip-list input
  (type + Enter/comma/blur to add, click-to-remove chip), shared by the two forms
  below so the interaction is identical everywhere.
- `src/components/AlertEditForm.tsx` — swap the partnership/seeker "Home airport"
  text input for `AirportChipsInput`; seed/submit `airports: string[]` instead of
  `airport: string`.
- `src/components/NewAlertForm.tsx` — same swap (covers both the plain "+ New
  alert" flow and AlertEditForm's "Duplicate", which prefills via `initial`).
- `src/lib/alertOverlap.ts` — `definedEntries`/`valuesEqual` currently treat any
  non-string field as "defined" via `!= null` and compare by reference; an
  `airports: string[]` field would break both (an empty array would wrongly count
  as a constraint, and two equal-content arrays would wrongly compare unequal via
  `===`). Fix both helpers to handle arrays correctly (empty = unconstrained,
  compare by sorted/case-insensitive content) — required for this change, not a
  drive-by.
- `src/lib/alertOverlap.test.ts` — update the `partnership()` test helper to
  `airports: string[]`; add a case covering multi-airport array equality/subset
  behavior.

## Acceptance criteria
- A seeker or partnership alert whose `source_path` carries `airports=A,B` (2+
  codes) now shows those codes as removable chips in the Edit form (previously:
  blank field, criterion silently protected-but-invisible for seeker, or fully
  hidden for partnership).
- Adding/removing a chip and hitting Save persists the new `airports=` list;
  saving with zero chips clears the location criterion entirely (matches the
  existing "blank means unconstrained" convention).
- Duplicate (`NewAlertForm` via `initial`) now carries the full multi-airport list
  into the newly created alert instead of dropping to zero/one code.
- A single-airport alert continues to behave identically end-to-end (still writes
  a clean, minimal `airports=` — or legacy `airport=` is read but normalized to
  `airports=` on any save, same normalization the browse filters already apply).
- `radius` (not exposed by this form) is preserved untouched when the edited
  airport count stays at 1, and dropped when it changes to 0 or 2+ (mirrors
  `SeekerFilters`'/`PartnershipFilters`' own `setAirports` rule — radius is only
  meaningful around exactly one airport).
- `alertOverlap.ts`'s subsumption logic stays correct for the new array field
  (verified via updated/new test cases) — no regression to the aircraft-only
  cases already covered.
- `next build` + typecheck clean; existing `alertOverlap.test.ts` (extended) and
  the rest of the `.test.ts` suite pass; QA smoke on `/alerts/manage` (desktop +
  mobile) passes with a real multi-airport alert row exercised live.

## Out of scope
- Exposing `radius` itself as an editable field (separate P2 backlog item).
- Year-range fields (separate P2 backlog item).
- Touching `SeekerFilters.tsx`/`PartnershipFilters.tsx` browse-page filters
  (already correct) or the cron digest matcher (`alert-digest/route.ts`,
  `alertSubscriberMatch.ts`) — already honors `airports=` correctly.
- Consolidating the three now-duplicated `parseAirportCodes` implementations into
  one shared module.
