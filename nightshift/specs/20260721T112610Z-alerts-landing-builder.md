# Spec: "Build your own alert" on the `/alerts` landing page

## Goal
Let a visitor on `/alerts` construct a custom alert from scratch (type + make/model/
state/price/year/hours or airports+radius) instead of only picking from the curated
popular chips, then subscribe anonymously (email + double opt-in) — closing the last
open `[P1][goal]` alert-experience item in `BACKLOG.md`.

## Scope
- `src/components/AlertBuilder.tsx` (new, client) — collapsed-by-default "Build a
  custom alert" toggle. Reuses the same type-picker + criteria-field UI shape as
  `NewAlertForm.tsx` (aircraft: make/model/state/price/year/TT; partnership/seeker:
  make/state/airports+radius; seeker also has model). Computes `sourcePath`/`context`
  live via the existing `buildAlertCriteriaUpdate(type, null, fields)` helper
  (`src/lib/alertEditCriteria.ts`) and a debounced (350ms) live match-count preview
  via the existing `getAlertMatchCountForSourcePath` action (`src/app/actions.ts`) —
  same pattern `AlertEditForm.tsx` already uses. A "Continue →" step locks in the
  computed context/sourcePath/noun and reveals the existing `AlertSignup` component
  (anonymous email capture + double opt-in via `subscribeToAlerts`, unchanged) with
  `source="alerts_landing_builder"`. A "← Edit criteria" link unlocks to adjust.
- `src/components/AlertsLanding.tsx` — render `<AlertBuilder />` below the existing
  chip-based capture flow (an alternative path, not a replacement).
- No schema/action/migration change — pure UI composition of existing, proven pieces
  (`AlertSignup`, `buildAlertCriteriaUpdate`, `getAlertMatchCountForSourcePath`).

## Acceptance criteria
1. `/alerts` renders a collapsed "Build a custom alert" trigger below the existing
   chip flow; expanding it shows the type picker (Aircraft/Partnership/Seeking) +
   the matching criteria fields.
2. Editing any field updates a live, honest match-count line within ~350ms via the
   real `getAlertMatchCountForSourcePath` query (never a fabricated number; renders
   nothing while unknown/loading rather than a fake 0).
3. Clicking "Continue" locks the computed `context`/`sourcePath`/`noun` and renders
   the real `AlertSignup` component with `source="alerts_landing_builder"` — a
   completed submit creates a real double-opt-in `alerts` row and fires
   `alert_subscribed` with that source, exactly like every other capture point.
4. "← Edit criteria" returns to the field-editing state without losing entered values.
5. No regression to the existing interest-chip flow above it on the same page.
6. `next build` + typecheck clean; QA smoke passes on `/alerts` at desktop 1280 +
   mobile 375 with zero app-origin console errors and zero horizontal overflow.

## Out of scope
- Any change to `AlertSignup`, `subscribeToAlerts`, `NewAlertForm`, or
  `buildAlertCriteriaUpdate` themselves.
- Avionics/grade/keyword fields (separate `[P2][goal]` BACKLOG items).
- Accessibility pass (separate `[P2][goal]` BACKLOG item).
