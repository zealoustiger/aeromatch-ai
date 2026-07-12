# Placement `source` tag on every `alert_subscribed` event

## Goal
Give every `alert_subscribed` analytics event an honest, distinct `source` field so GOAL.md's
"prove it converts" analysis can tell which of the ~23 alert-capture placements actually
converts — today all of them (and `QuickStartSearchForm`'s saved-search alert) fire
indistinguishable events, and `source_path` alone conflates placements that share a search URL.

## Scope
- `src/components/AlertSignup.tsx` — add optional `source?: string` prop; include it in all
  three `track('alert_subscribed', ...)` calls (anonymous submit, signed-in one-click submit)
  when provided; no server-action/schema change.
- `src/components/QuickStartSearchForm.tsx` — add `source: 'saved_search'` to its existing
  `track('alert_subscribed', ...)` call (consistent with `SavedSearchAlertButton.tsx`'s
  existing `source: 'saved_search'`).
- Every render call site of `<AlertSignup>` (~23, via `grep -rn "<AlertSignup" src`) gets a
  `source` prop naming its distinct placement, e.g.:
  - `listing_detail`, `sold_listing`, `make_model_page`, `make_model_state_page`, `make_page`,
    `state_page`, `mission_page`, `browse_footer`, `airport_page`, `not_found`,
    `homepage_band`, `partnership_detail`, `partnership_make_page`,
    `partnerships_near_airport`, `seeking_detail`, `seeking_page`, `partnership_state_page`,
    `cost_calculator`, `empty_state`, `alerts_landing`.

## Acceptance criteria
- Every `<AlertSignup>` JSX call site (and `QuickStartSearchForm`) passes a `source` prop
  accurately describing that literal placement (no two structurally-different placements share
  a value unless they're genuinely the same pattern across marketplaces, e.g. two different
  browse-footer pages — disambiguated already by `source_path`).
- `AlertSignup`'s `track('alert_subscribed', ...)` payload includes `source` on both the
  anonymous and signed-in submit paths when a source was provided; `undefined` (never a
  fabricated default) when omitted.
- No change to `subscribeToAlerts`/`subscribeSignedInAlert` signatures or the `alerts` table.
- No visible/behavioral change to any page.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes (HTTP 200, no console errors, no overflow) on a representative sample of
  touched pages.

## Out of scope
- Any DB schema change (no `source` column on `alerts`).
- Any change to `subscribeToAlerts` / `subscribeSignedInAlert` server action signatures.
- Any visual/copy change.
