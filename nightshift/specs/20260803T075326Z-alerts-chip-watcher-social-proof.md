# Spec — Honesty-gated "N watching" social proof on `/alerts` curated chips

Slug: `alerts-chip-watcher-social-proof`
Intent: `[P1][goal]` — alert experience (prove-it-converts / smart-honest content).
Source item: BACKLOG "Plan-pass batch — 2026-08-03" — "Alert-count social proof on the
`/alerts` landing curated chips."

## Goal
On the `/alerts` landing, show a quiet, honest "N watching" count on each curated popular
alert chip that genuinely has enough real, distinct confirmed subscribers — nudging a
visitor to set that alert — never fabricating or inflating a number.

## Scope (small)
- **New** `src/lib/alertWatcherCounts.ts` — mirrors `src/lib/saveCounts.ts` exactly:
  service-role read of the PII-protected `alerts` table, returns **counts only** (never
  emails), fail-soft to an empty map. Exports a pure `tallyWatchers(rows)` helper (distinct,
  case-insensitive emails per exact `source_path`) + `getAlertWatcherCounts(paths)` +
  `MIN_WATCHERS_TO_SHOW`.
- `src/app/alerts/page.tsx` — after building the honesty-gated popular chips, fetch watcher
  counts for those chip paths and attach `watchers` to a chip **only when ≥ MIN_WATCHERS_TO_SHOW**
  (sub-threshold counts never reach the client).
- `src/components/AlertsLanding.tsx` + its `PopularChip` interface — carry the optional
  `watchers` through and render a compact "· N watching" suffix inside the chip pill when present.
- **New** `src/lib/alertWatcherCounts.test.ts` — pure-function tests for `tallyWatchers`.

## Acceptance criteria
- `next build` + `tsc --noEmit` clean; full unit suite green incl. the new test.
- The watcher count is computed from **real** `alerts` rows (`status = 'confirmed'`, exact
  `source_path` match), de-duplicated to **distinct emails**, and **suppressed below
  `MIN_WATCHERS_TO_SHOW`** — a chip with too few (or zero) real subscribers shows no count.
- Counts are read via the service-role admin client and only an integer reaches the client —
  no subscriber email/identity is ever sent to the browser.
- The helper fails soft: any DB error yields no count line, never a thrown error or a fake 0.
- `/alerts` still passes the smoke gate at desktop 1280 + mobile 375 (HTTP 200, 0 app-console
  errors, 0 horizontal overflow); the "· N watching" suffix renders cleanly with no pill
  overflow when present (verified against a seeded chip).
- No new PostHog/capture event (read-only nudge), no schema change.

## Out of scope
- Per-chip counts on the non-curated catch-all `BASE_INTERESTS` chips (`/aircraft`,
  `/partnerships`, `/partnerships/seeking`) — those are broad and not "an alert someone set."
- Any change to what the chips link to, the sample-preview logic, or the capture flow.
- Live watcher counts anywhere other than the `/alerts` landing.
- Changing the alert confirmation/subscribe pipeline.
