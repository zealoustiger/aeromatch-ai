# partnership-alert-model-match

## Goal
Make partnership alerts honor the `model` filter, so a subscriber who alerted on
"Cessna 172 partnerships" only gets emailed about Cessna 172 partnerships — not
every Cessna partnership — matching the honesty fix already shipped for aircraft
avionics matching (`alert-avionics-match`, 2026-07-14).

## Background
`/partnerships?make=Cessna&model=172` browse-filters by `model` (a real column,
comma-joined multi-select, exact match — see `partnershipsQuery.ts` lines
122-127 and `PartnershipFilters.tsx`/`PartnershipActiveFilterChips.tsx`), and
the browse page passes `alertContext`/`alertSourcePath` down to `AlertSignup`.
But:
- The partnership `AlertTarget` type (both `src/lib/alertMatchCounts.ts` and
  `src/app/api/cron/alert-digest/route.ts`) has no `model` field — `parseSourcePath`/
  `resolveTarget` silently drop it.
- `countActivePartnerships` (match-count for `/alerts/manage`), `countNewPartnerships`,
  `countRecentPartnershipPriceDrops`, `fetchNewPartnershipSamples`,
  `fetchPartnershipPriceDropSamples` (digest cron) never filter by model.
- `src/app/partnerships/page.tsx`'s `alertContext`/`alertQuery` construction (lines
  115-135) only reads make/state/airport, so the alert confirmation/context sentence
  and the captured `source_path` itself never carry a selected model at all —
  the capture point drops the filter before it even reaches the parser.

Net effect: a partnership alert set with a model filter active silently becomes a
make-wide (or site-wide) alert. Same dishonesty class GOAL.md calls out ("only fire
on genuine matches").

Unlike aircraft avionics (a `text[]` column needing description classification),
`partnerships.model` is a plain text column — this is a much simpler SQL
`.eq`/`.in` filter, no async scan needed. Model matching semantics mirror the
browse page's own comma-list OR filter exactly (`partnershipsQuery.ts` 122-127).

## Scope
- `src/app/partnerships/page.tsx` — thread `model` into `alertContext` and
  `alertQuery`/`alertSourcePath` construction (the missing capture-side wiring).
- `src/lib/alertMatchCounts.ts` — add `model?: string` to the partnership
  `AlertTarget` variant; parse it in `parseSourcePath`; filter by it in
  `countActivePartnerships`.
- `src/app/api/cron/alert-digest/route.ts` — same: add `model?: string` to the
  partnership `AlertTarget` variant; parse it in `resolveTarget`; filter by it in
  `countNewPartnerships`, `countRecentPartnershipPriceDrops`,
  `fetchNewPartnershipSamples`, `fetchPartnershipPriceDropSamples`.
- Add/extend unit tests for the pure model-list-parsing logic where testable
  without Supabase (mirrors the avionics cycle's approach).

## Out of scope
- `src/lib/alertEditCriteria.ts` / `AlertEditForm` — exposing model as an editable
  field on `/alerts/manage`'s edit form is the separate, already-queued
  `[P2][goal]` "hidden advanced criteria" backlog item. Model set at capture time
  will still be silently preserved through an edit (same as any other
  form-unexposed param, per that file's existing "layer onto existing querystring"
  behavior) — just not editable or shown yet. Not changing this file this cycle.
- No schema change (model is already a plain existing column).
- No new alert capture point / no new `alert_subscribed` event shape.
- Seeker-side model matching (already correctly implemented via `matchesModelFilter`).

## Acceptance criteria
- Setting a partnership alert on `/partnerships?make=Cessna&model=172` produces a
  `source_path` that includes `model=172`, and the alert-context sentence names
  the model (e.g. "Cessna 172").
- `/alerts/manage`'s live match count for such an alert only counts active Cessna
  172 partnerships, not all Cessna partnerships (verified against real prod data,
  read-only).
- The digest cron's new-partnership count/samples and price-drop count/samples for
  a model-scoped alert only include partnerships matching that model.
- Multi-select model (`model=172,182`) is honored as an OR, matching the browse
  page's own semantics.
- No model param → unchanged behavior (make-wide, exactly as today).
- `npx tsc --noEmit` and `npx next build` both exit 0; existing test suite stays
  green; QA smoke passes on `/partnerships`, a model-filtered `/partnerships` URL,
  and `/alerts/manage`.
